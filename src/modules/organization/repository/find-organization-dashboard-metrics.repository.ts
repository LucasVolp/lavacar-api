import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Weekday } from 'prisma/generated';
import { endOfDay, startOfDay, subDays, subMonths, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { getEndOfDayInTimezone, getStartOfDayInTimezone, timeToMinutes } from 'src/shared/utils/time.util';

export type OrganizationMetricsPeriod = '7d' | '30d' | '90d' | 'lifetime';

export interface OrganizationDashboardMetricsFilters {
  period?: OrganizationMetricsPeriod;
  startDate?: Date;
  endDate?: Date;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

interface ShopOperationalMetrics {
  appointmentsToday: number;
  inProgressNow: number;
  totalAppointments: number;
  completedAppointments: number;
  revenue: number;
  isOpenNow: boolean;
}

const CANCELED_STATUSES: AppointmentStatus[] = [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW];
const COMPLETED_STATUS = AppointmentStatus.COMPLETED;
const WEEKDAY_BY_NUMBER: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

@Injectable()
export class FindOrganizationDashboardMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrganizationDashboardMetrics(
    organizationId: string,
    filters: OrganizationDashboardMetricsFilters = {},
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        shops: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logoUrl: true,
            bannerUrl: true,
            phone: true,
            email: true,
            street: true,
            number: true,
            neighborhood: true,
            city: true,
            state: true,
            timeZone: true,
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    const shopIds = organization.shops.map((shop) => shop.id);
    const range = this.getDateRange(filters);

    if (shopIds.length === 0) {
      return {
        organization: {
          id: organization.id,
          name: organization.name,
          logoUrl: organization.logoUrl,
        },
        period: filters.period || '30d',
        range,
        summary: {
          totalRevenue: 0,
          totalAppointments: 0,
          completedAppointments: 0,
          canceledAppointments: 0,
          inProgressNow: 0,
          averageTicket: 0,
          uniqueClients: 0,
          newClients: 0,
          recurringClients: 0,
        },
        shops: [],
        ranking: [],
        topServices: [],
        revenueSeries: [],
      };
    }

    const appointmentsWhere = {
      shopId: { in: shopIds },
      ...(range.startDate || range.endDate
        ? {
            scheduledAt: {
              ...(range.startDate ? { gte: range.startDate } : {}),
              ...(range.endDate ? { lte: range.endDate } : {}),
            },
          }
        : {}),
    };

    const [appointments, schedules] = await Promise.all([
      this.prisma.appointment.findMany({
        where: appointmentsWhere,
        select: {
          id: true,
          userId: true,
          shopId: true,
          status: true,
          scheduledAt: true,
          endTime: true,
          totalPrice: true,
          services: {
            select: {
              serviceId: true,
              serviceName: true,
              servicePrice: true,
            },
          },
        },
      }),
      this.prisma.schedule.findMany({
        where: { shopId: { in: shopIds } },
        select: {
          shopId: true,
          weekday: true,
          isOpen: true,
          startTime: true,
          endTime: true,
          breakStartTime: true,
          breakEndTime: true,
        },
      }),
    ]);

    const now = new Date();

    const appointmentsByShop = new Map<string, typeof appointments>();
    for (const appointment of appointments) {
      const list = appointmentsByShop.get(appointment.shopId) || [];
      list.push(appointment);
      appointmentsByShop.set(appointment.shopId, list);
    }

    const schedulesByShop = new Map<string, typeof schedules>();
    for (const schedule of schedules) {
      const list = schedulesByShop.get(schedule.shopId) || [];
      list.push(schedule);
      schedulesByShop.set(schedule.shopId, list);
    }

    const shopMetrics = organization.shops.map((shop) => {
      const shopAppointments = appointmentsByShop.get(shop.id) || [];
      const metrics = this.calculateShopMetrics({
        appointments: shopAppointments,
        schedules: schedulesByShop.get(shop.id) || [],
        now,
        timeZone: shop.timeZone || 'America/Sao_Paulo',
      });

      return {
        ...shop,
        ...metrics,
      };
    });

    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === COMPLETED_STATUS,
    );

    const totalRevenue = completedAppointments.reduce(
      (sum, appointment) => sum + Number(appointment.totalPrice),
      0,
    );

    const canceledAppointments = appointments.filter((appointment) =>
      CANCELED_STATUSES.includes(appointment.status),
    ).length;

    const uniqueClients = new Set(appointments.map((appointment) => appointment.userId));

    const { newClients, recurringClients } = await this.resolveClientMix({
      shopIds,
      appointments,
      periodStart: range.startDate,
    });

    const servicesMap = new Map<
      string,
      { serviceId: string; serviceName: string; count: number; revenue: number }
    >();

    for (const appointment of completedAppointments) {
      for (const service of appointment.services) {
        const current = servicesMap.get(service.serviceId) || {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          count: 0,
          revenue: 0,
        };

        current.count += 1;
        current.revenue += Number(service.servicePrice);
        servicesMap.set(service.serviceId, current);
      }
    }

    const topServices = Array.from(servicesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const revenueSeries = this.buildRevenueSeries(appointments, filters.period || '30d');

    const ranking = [...shopMetrics]
      .sort((a, b) => b.revenue - a.revenue)
      .map((shop, index) => ({
        rank: index + 1,
        shopId: shop.id,
        name: shop.name,
        revenue: shop.revenue,
        completedAppointments: shop.completedAppointments,
      }));

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        logoUrl: organization.logoUrl,
      },
      period: filters.period || '30d',
      range,
      summary: {
        totalRevenue,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        canceledAppointments,
        inProgressNow: shopMetrics.reduce((sum, shop) => sum + shop.inProgressNow, 0),
        averageTicket: completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0,
        uniqueClients: uniqueClients.size,
        newClients,
        recurringClients,
      },
      shops: shopMetrics,
      ranking,
      topServices,
      revenueSeries,
    };
  }

  private getDateRange(filters: OrganizationDashboardMetricsFilters): DateRange {
    if (filters.startDate || filters.endDate) {
      return {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
    }

    const now = new Date();

    switch (filters.period) {
      case '7d':
        return {
          startDate: startOfDay(subDays(now, 6)),
          endDate: endOfDay(now),
        };
      case '90d':
        return {
          startDate: startOfDay(subMonths(now, 3)),
          endDate: endOfDay(now),
        };
      case 'lifetime':
        return {};
      case '30d':
      default:
        return {
          startDate: startOfDay(subDays(now, 29)),
          endDate: endOfDay(now),
        };
    }
  }

  private calculateShopMetrics({
    appointments,
    schedules,
    now,
    timeZone,
  }: {
    appointments: Array<{
      status: AppointmentStatus;
      scheduledAt: Date;
      totalPrice: unknown;
    }>;
    schedules: Array<{
      weekday: Weekday;
      isOpen: string;
      startTime: string;
      endTime: string;
      breakStartTime: string | null;
      breakEndTime: string | null;
    }>;
    now: Date;
    timeZone: string;
  }): ShopOperationalMetrics {
    const todayStart = getStartOfDayInTimezone(now, timeZone);
    const todayEnd = getEndOfDayInTimezone(now, timeZone);

    const appointmentsToday = appointments.filter(
      (appointment) => appointment.scheduledAt >= todayStart && appointment.scheduledAt <= todayEnd,
    ).length;

    const inProgressNow = appointments.filter((appointment) => appointment.status === AppointmentStatus.IN_PROGRESS)
      .length;

    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === COMPLETED_STATUS,
    );

    const revenue = completedAppointments.reduce(
      (sum, appointment) => sum + Number(appointment.totalPrice),
      0,
    );

    return {
      appointmentsToday,
      inProgressNow,
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
      revenue,
      isOpenNow: this.resolveIsOpenNow({ schedules, now, timeZone }),
    };
  }

  private resolveIsOpenNow({
    schedules,
    now,
    timeZone,
  }: {
    schedules: Array<{
      weekday: Weekday;
      isOpen: string;
      startTime: string;
      endTime: string;
      breakStartTime: string | null;
      breakEndTime: string | null;
    }>;
    now: Date;
    timeZone: string;
  }): boolean {
    const zonedNow = toZonedTime(now, timeZone);
    const weekday = WEEKDAY_BY_NUMBER[zonedNow.getDay()];
    const currentMinutes = zonedNow.getHours() * 60 + zonedNow.getMinutes();

    const schedule = schedules.find((item) => item.weekday === weekday);

    if (!schedule || schedule.isOpen !== 'ACTIVE') {
      return false;
    }

    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return false;
    }

    if (schedule.breakStartTime && schedule.breakEndTime) {
      const breakStart = timeToMinutes(schedule.breakStartTime);
      const breakEnd = timeToMinutes(schedule.breakEndTime);
      if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
        return false;
      }
    }

    return true;
  }

  private async resolveClientMix({
    shopIds,
    appointments,
    periodStart,
  }: {
    shopIds: string[];
    appointments: Array<{ userId: string; status: AppointmentStatus }>;
    periodStart?: Date;
  }) {
    const activeAppointments = appointments.filter(
      (appointment) => !CANCELED_STATUSES.includes(appointment.status),
    );

    const userIds = Array.from(new Set(activeAppointments.map((appointment) => appointment.userId)));

    if (userIds.length === 0) {
      return { newClients: 0, recurringClients: 0 };
    }

    if (!periodStart) {
      const appointmentsByUser = new Map<string, number>();
      for (const appointment of activeAppointments) {
        appointmentsByUser.set(
          appointment.userId,
          (appointmentsByUser.get(appointment.userId) || 0) + 1,
        );
      }

      let recurringClients = 0;
      for (const count of appointmentsByUser.values()) {
        if (count > 1) {
          recurringClients += 1;
        }
      }

      return {
        recurringClients,
        newClients: Math.max(userIds.length - recurringClients, 0),
      };
    }

    const existingClients = await this.prisma.appointment.findMany({
      where: {
        shopId: { in: shopIds },
        userId: { in: userIds },
        scheduledAt: { lt: periodStart },
        status: { notIn: CANCELED_STATUSES },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const existingClientIds = new Set(existingClients.map((client) => client.userId));

    let recurringClients = 0;
    for (const userId of userIds) {
      if (existingClientIds.has(userId)) {
        recurringClients += 1;
      }
    }

    return {
      recurringClients,
      newClients: Math.max(userIds.length - recurringClients, 0),
    };
  }

  private buildRevenueSeries(
    appointments: Array<{ scheduledAt: Date; status: AppointmentStatus; totalPrice: unknown }>,
    period: OrganizationMetricsPeriod,
  ) {
    const groupByMonth = period === 'lifetime';
    const grouped = new Map<string, { label: string; revenue: number; appointments: number }>();

    for (const appointment of appointments) {
      const key = groupByMonth
        ? format(appointment.scheduledAt, 'yyyy-MM')
        : format(appointment.scheduledAt, 'yyyy-MM-dd');
      const label = groupByMonth
        ? format(appointment.scheduledAt, 'MM/yyyy')
        : format(appointment.scheduledAt, 'dd/MM');

      const current = grouped.get(key) || {
        label,
        revenue: 0,
        appointments: 0,
      };

      current.appointments += 1;
      if (appointment.status === COMPLETED_STATUS) {
        current.revenue += Number(appointment.totalPrice);
      }

      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, value]) => ({
        dateKey,
        label: value.label,
        revenue: value.revenue,
        appointments: value.appointments,
      }));
  }
}
