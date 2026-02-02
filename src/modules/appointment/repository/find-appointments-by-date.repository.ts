import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";
import { getStartOfDayInTimezone, getEndOfDayInTimezone } from "src/shared/utils";

@Injectable()
export class FindAppointmentsByDateRepository {
    constructor(private readonly prisma: PrismaService) {}
    async findByShopAndDate(shopId: string, date: Date) {
        const startOfDay = getStartOfDayInTimezone(date);
        const endOfDay = getEndOfDayInTimezone(date);

        return await this.prisma.appointment.findMany({
            where: {
                shopId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
                },
            },
            select: {
                id: true,
                scheduledAt: true,
                endTime: true,
                totalDuration: true,
                status: true,
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}
