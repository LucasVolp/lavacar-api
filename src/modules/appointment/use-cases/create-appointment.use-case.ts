import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ConflictException,
    ServiceUnavailableException 
} from "@nestjs/common";
import { CreateAppointmentRepository, FindAppointmentsByDateRepository } from "../repository";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { PrismaService } from "src/shared/databases/prisma.database";
import { timeToMinutes, isTimeOverlapping } from "src/shared/utils";
import { Weekday, BlockedTimeType } from "prisma/generated";

@Injectable()
export class CreateAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: CreateAppointmentRepository,
        private readonly findByDateRepository: FindAppointmentsByDateRepository,
        private readonly prisma: PrismaService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateAppointmentDto) {
        try {
            const scheduledDate = new Date(data.scheduledDate);
            const scheduledTime = data.scheduledTime;

            // 1. Buscar shop e validar configurações
            const shop = await this.prisma.shop.findUnique({
                where: { id: data.shopId },
            });

            if (!shop) {
                throw new NotFoundException('Shop not found');
            }

            if (shop.status !== 'ACTIVE') {
                throw new BadRequestException('Shop is not active');
            }

            // 2. Validar antecedência mínima
            const scheduledAt = this.buildScheduledDateTime(scheduledDate, scheduledTime);
            const now = new Date();
            const minAdvanceTime = new Date(now.getTime() + shop.minAdvanceMinutes * 60000);

            if (scheduledAt < minAdvanceTime) {
                throw new BadRequestException(
                    `Appointment must be scheduled at least ${shop.minAdvanceMinutes} minutes in advance`
                );
            }

            // 3. Validar máximo de dias à frente
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + shop.maxAdvanceDays);

            if (scheduledAt > maxDate) {
                throw new BadRequestException(
                    `Appointment cannot be scheduled more than ${shop.maxAdvanceDays} days in advance`
                );
            }

            // 4. Buscar serviços e calcular duração/preço total
            const services = await this.prisma.service.findMany({
                where: {
                    id: { in: data.serviceIds },
                    shopId: data.shopId,
                    isActive: true,
                },
            });

            if (services.length !== data.serviceIds.length) {
                throw new NotFoundException('One or more services not found or inactive');
            }

            const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
            const totalPrice = services.reduce((acc, s) => acc + Number(s.price), 0);

            // 5. Calcular horário de término
            const endTime = new Date(scheduledAt.getTime() + totalDuration * 60000);
            const endTimeString = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

            // 6. Verificar se o dia está bloqueado
            const blockedTime = await this.prisma.blockedTime.findFirst({
                where: {
                    shopId: data.shopId,
                    date: scheduledDate,
                },
            });

            if (blockedTime) {
                if (blockedTime.type === BlockedTimeType.FULL_DAY) {
                    throw new ConflictException('This day is blocked for appointments');
                }

                // PARTIAL - verificar se o horário conflita
                if (blockedTime.startTime && blockedTime.endTime) {
                    if (isTimeOverlapping(scheduledTime, endTimeString, blockedTime.startTime, blockedTime.endTime)) {
                        throw new ConflictException('This time slot is blocked');
                    }
                }
            }

            // 7. Verificar horário de funcionamento
            const weekday = this.getWeekdayEnum(scheduledDate);
            const schedule = await this.prisma.schedule.findUnique({
                where: {
                    weekday_shopId: {
                        weekday,
                        shopId: data.shopId,
                    },
                },
            });

            if (!schedule || schedule.isOpen !== 'ACTIVE') {
                throw new BadRequestException('Shop is closed on this day');
            }

            // Verificar se o horário está dentro do funcionamento
            const scheduleStart = timeToMinutes(schedule.startTime);
            const scheduleEnd = timeToMinutes(schedule.endTime);
            const appointmentStart = timeToMinutes(scheduledTime);
            const appointmentEnd = timeToMinutes(endTimeString);

            if (appointmentStart < scheduleStart || appointmentEnd > scheduleEnd) {
                throw new BadRequestException(
                    `Appointment must be within working hours (${schedule.startTime} - ${schedule.endTime})`
                );
            }

            // Verificar conflito com intervalo (almoço)
            if (schedule.breakStartTime && schedule.breakEndTime) {
                if (isTimeOverlapping(scheduledTime, endTimeString, schedule.breakStartTime, schedule.breakEndTime)) {
                    throw new BadRequestException(
                        `Appointment conflicts with break time (${schedule.breakStartTime} - ${schedule.breakEndTime})`
                    );
                }
            }

            // 8. Verificar conflito com outros agendamentos
            const existingAppointments = await this.findByDateRepository.findByShopAndDate(
                data.shopId,
                scheduledDate
            );

            for (const existing of existingAppointments) {
                const existingStart = `${existing.scheduledAt.getHours().toString().padStart(2, '0')}:${existing.scheduledAt.getMinutes().toString().padStart(2, '0')}`;

                // Considerar buffer entre agendamentos
                const bufferEnd = new Date(existing.endTime.getTime() + shop.bufferBetweenSlots * 60000);
                const bufferEndString = `${bufferEnd.getHours().toString().padStart(2, '0')}:${bufferEnd.getMinutes().toString().padStart(2, '0')}`;

                if (isTimeOverlapping(scheduledTime, endTimeString, existingStart, bufferEndString)) {
                    throw new ConflictException('This time slot is already booked');
                }
            }

            // 9. Validar veículo pertence ao usuário
            const vehicle = await this.prisma.vehicle.findFirst({
                where: {
                    id: data.vehicleId,
                    userId: data.userId,
                    isActive: true,
                },
            });

            if (!vehicle) {
                throw new NotFoundException('Vehicle not found or does not belong to user');
            }

            // 10. Criar agendamento
            const appointment = await this.appointmentRepository.create({
                scheduledAt,
                endTime,
                totalPrice,
                totalDuration,
                notes: data.notes,
                userId: data.userId,
                shopId: data.shopId,
                vehicleId: data.vehicleId,
                services: services.map(s => ({
                    serviceId: s.id,
                    serviceName: s.name,
                    servicePrice: Number(s.price),
                    duration: s.duration,
                })),
            });

            this.logger.log(
                `Appointment created: ${appointment.id} for ${scheduledDate.toISOString().split('T')[0]} at ${scheduledTime}`,
                CreateAppointmentUseCase.name
            );

            return appointment;
        } catch (err) {
            // Re-throw business exceptions
            if (
                err instanceof BadRequestException ||
                err instanceof NotFoundException ||
                err instanceof ConflictException
            ) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating appointment',
            });
            this.logger.error(error.message, err.stack, CreateAppointmentUseCase.name);
            throw error;
        }
    }

    private buildScheduledDateTime(date: Date, time: string): Date {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledAt = new Date(date);
        scheduledAt.setHours(hours, minutes, 0, 0);
        return scheduledAt;
    }

    private getWeekdayEnum(date: Date): Weekday {
        const weekdays: Weekday[] = [
            Weekday.SUNDAY,
            Weekday.MONDAY,
            Weekday.TUESDAY,
            Weekday.WEDNESDAY,
            Weekday.THURSDAY,
            Weekday.FRIDAY,
            Weekday.SATURDAY,
        ];
        return weekdays[date.getDay()];
    }
}
