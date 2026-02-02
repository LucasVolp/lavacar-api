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
import { timeToMinutes, extractTimeFromDateTime, extractWeekdayFromDateTime, isTimeOverlapping, addMinutesToTime, getStartOfDayInTimezone } from "src/shared/utils";
import { Weekday, BlockedTimeType } from "prisma/generated";
import { FindUserRepository } from "src/modules/users/repository";
import { FindShopByIdRepository } from "src/modules/shop/repository";
import { ShopStatus } from "src/modules/shop/types/ShopStatus";
import { FindServicesByIdsRepository } from "src/modules/service/repository";
import { FindScheduleByWeekdayRepository } from "src/modules/schedule/repository";
import { FindVehicleByIdRepository } from "src/modules/vehicle/repository";
import { FindBlockedTimeByShopIdRepository } from "src/modules/blocked-time/repository";
@Injectable()
export class CreateAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: CreateAppointmentRepository,
        private readonly findByDateRepository: FindAppointmentsByDateRepository,
        private readonly findServicesRepository: FindServicesByIdsRepository,
        private readonly findUserByIdRepository: FindUserRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findScheduleByIdRepository: FindScheduleByWeekdayRepository,
        private readonly findVehicleByIdRepository: FindVehicleByIdRepository,
        private readonly findBlockedTimeByShopRepository: FindBlockedTimeByShopIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateAppointmentDto) {
        try {
            const userExists = await this.findUserByIdRepository.findById(data.userId);
            if (!userExists) {
                this.logger.warn(`User not found with ID: ${data.userId}`, CreateAppointmentUseCase.name);
                throw new NotFoundException('User not found');
            }

            const shopExists = await this.findShopByIdRepository.findById(data.shopId);
            if (!shopExists) {
                this.logger.warn(`Shop not found with ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new NotFoundException('Shop not found');
            }

            if (shopExists.status !== ShopStatus.ACTIVE) {
                this.logger.warn(`Shop with ID: ${data.shopId} is not active`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Shop is not active');
            }

            if (data.vehicleId) {
                const vehicleExists = await this.findVehicleByIdRepository.findById(data.vehicleId);
                if (!vehicleExists) {
                    this.logger.warn(`Vehicle not found with ID: ${data.vehicleId}`, CreateAppointmentUseCase.name);
                    throw new NotFoundException('Vehicle not found');
                } else if (vehicleExists.userId !== data.userId) {
                    this.logger.warn(`Vehicle with ID: ${data.vehicleId} does not belong to user ID: ${data.userId}`, CreateAppointmentUseCase.name);
                    throw new BadRequestException('Vehicle does not belong to the user');
                }
            }

            const serviceIds = data.serviceIds.map(service => service.serviceId);
            const servicesExists = await this.findServicesRepository.findByIds(serviceIds, data.shopId);

            if (servicesExists.length !== serviceIds.length) {
                this.logger.warn(`One or more services not found for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new NotFoundException('One or more services not found for this shop');
            }

            // Calcular duração total e preço total dos serviços
            const totalDuration = servicesExists.reduce((total, service) => total + service.duration, 0);
            const totalPrice = servicesExists.reduce((total, service) => total + Number(service.price), 0);

            // Extrair horários do agendamento
            const scheduledAt = new Date(data.scheduledAt);
            const startTime = extractTimeFromDateTime(scheduledAt);
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = startMinutes + totalDuration;
            const endTime = addMinutesToTime(startTime, totalDuration);
            const endDateTime = new Date(scheduledAt.getTime() + totalDuration * 60000);
            const weekday = extractWeekdayFromDateTime(scheduledAt) as Weekday;

            // Verifica se o shop tem horário cadastrado para o dia da semana
            const schedule = await this.findScheduleByIdRepository.findScheduleByWeekday(weekday, data.shopId);
            
            if (!schedule || schedule.isOpen !== 'ACTIVE') {
                this.logger.warn(`No schedule found for shop ID: ${data.shopId} on weekday: ${weekday}`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Shop is closed on the selected day');
            }

            const shopOpenMinutes = timeToMinutes(schedule.startTime);
            const shopCloseMinutes = timeToMinutes(schedule.endTime);

            // Debug logs
            this.logger.debug(`
                Appointment Time Debug:
                ScheduledAt (UTC): ${data.scheduledAt}
                Local Time: ${startTime}
                Local Weekday: ${weekday}
                Duration: ${totalDuration}
                Start Minutes: ${startMinutes}
                End Minutes: ${endMinutes}
                Shop Open: ${schedule.startTime} (${shopOpenMinutes})
                Shop Close: ${schedule.endTime} (${shopCloseMinutes})
            `, CreateAppointmentUseCase.name);

            // Verifica se o agendamento começa dentro do horário
            if (startMinutes < shopOpenMinutes) {
                this.logger.warn(`Appointment starts before shop opens for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Appointment starts before shop opens');
            }

            // Verifica se o agendamento TERMINA dentro do horário
            if (endMinutes > shopCloseMinutes) {
                this.logger.warn(`Appointment ends after shop closes for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Appointment ends after shop closes');
            }

            // Verifica conflito com horário de intervalo (sobreposição completa)
            if (schedule.breakStartTime && schedule.breakEndTime) {
                if (isTimeOverlapping(startTime, endTime, schedule.breakStartTime, schedule.breakEndTime)) {
                    this.logger.warn(`Appointment overlaps with shop break time for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                    throw new BadRequestException('Appointment time overlaps with shop break time');
                }
            }

            // Verificar se não é no passado
            const now = new Date();
            if (scheduledAt <= now) {
                throw new BadRequestException('Cannot schedule appointments in the past');
            }

            // Verificar antecedência mínima
            const diffMinutes = (scheduledAt.getTime() - now.getTime()) / 60000;

            if (diffMinutes < shopExists.minAdvanceMinutes) {
                this.logger.warn(`Appointment does not meet minimum advance time for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new BadRequestException(
                    `Appointment must be scheduled at least ${shopExists.minAdvanceMinutes} minutes in advance`
                );
            }

            // Verificar máximo de dias à frente
            const diffDays = (scheduledAt.getTime() - now.getTime()) / (1000 * 3600 * 24);

            if (diffDays > shopExists.maxAdvanceDays) {
                throw new BadRequestException(
                    `Appointment cannot be scheduled more than ${shopExists.maxAdvanceDays} days in advance`
                );
            }

            // Verificar BlockedTime (feriados, bloqueios)
            const dateOnly = getStartOfDayInTimezone(scheduledAt);

            const blockedTime = await this.findBlockedTimeByShopRepository.findByShopAndDate(data.shopId, dateOnly);

            if (blockedTime) {
                if (blockedTime.type === BlockedTimeType.FULL_DAY) {
                    throw new BadRequestException(`Shop is closed on this date: ${blockedTime.reason || 'Blocked'}`);
                }

                if (blockedTime.type === BlockedTimeType.PARTIAL && blockedTime.startTime && blockedTime.endTime) {
                    if (isTimeOverlapping(startTime, endTime, blockedTime.startTime, blockedTime.endTime)) {
                        throw new BadRequestException(`Time slot is blocked: ${blockedTime.reason || 'Unavailable'}`);
                    }
                }
            }

            // Verificar conflito com agendamentos existentes
            const existingAppointments = await this.findByDateRepository.findByShopAndDate(data.shopId, scheduledAt);
            
            for (const appointment of existingAppointments) {
                const existingStart = extractTimeFromDateTime(appointment.scheduledAt);
                const existingEnd = extractTimeFromDateTime(appointment.endTime);

                if (isTimeOverlapping(startTime, endTime, existingStart, existingEnd)) {
                    this.logger.warn(`Appointment overlaps with existing appointment for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                    throw new ConflictException('Appointment time overlaps with an existing appointment');
                }
            }

            const appointment = await this.appointmentRepository.create({
                scheduledAt: scheduledAt.toISOString(),
                endTime: endDateTime.toISOString(),
                totalDuration,
                totalPrice,
                notes: data.notes,
                userId: data.userId,
                shopId: data.shopId,
                vehicleId: data.vehicleId,
                serviceIds: servicesExists.map(service => ({
                    serviceId: service.id,
                    serviceName: service.name,
                    servicePrice: Number(service.price),
                    duration: service.duration,
                })),
            });

            this.logger.log(`Appointment created with ID: ${appointment.id}`, CreateAppointmentUseCase.name);
            return appointment;
        } catch (err) {
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
}
