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
import { Prisma, Weekday, BlockedTimeType, Role } from "prisma/generated";
import { FindUserRepository } from "src/modules/users/repository";
import { FindShopByIdRepository } from "src/modules/shop/repository";
import { ShopStatus } from "src/modules/shop/types/ShopStatus";
import { FindServicesByIdsRepository } from "src/modules/service/repository";
import { FindScheduleByWeekdayRepository } from "src/modules/schedule/repository";
import { FindVehicleByIdRepository } from "src/modules/vehicle/repository";
import { FindBlockedTimeByShopIdRepository } from "src/modules/blocked-time/repository";
import { fromZonedTime } from "date-fns-tz";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateShopClientRepository, FindShopClientByShopAndUserRepository } from "src/modules/shop-client/repository";

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
        private readonly findShopClienteRepository: FindShopClientByShopAndUserRepository,
        private readonly createShopClientRepository: CreateShopClientRepository,
        private readonly prisma: PrismaService,
        private readonly logger: Logger = new Logger()
    ) {}

    private hasConflictWithBuffer(
        newStartTime: string,
        newEndTime: string,
        existingStartTime: string,
        existingEndTime: string,
        bufferBetweenSlots: number,
    ) {
        const newStart = timeToMinutes(newStartTime);
        const newEnd = timeToMinutes(newEndTime);
        const existingStart = timeToMinutes(existingStartTime) - bufferBetweenSlots;
        const existingEnd = timeToMinutes(existingEndTime) + bufferBetweenSlots;

        return newStart < existingEnd && newEnd > existingStart;
    }

    async getPublicAvailableSlots(params: { shopId: string; date: string; serviceIds: string[] }) {
        const { shopId, date, serviceIds } = params;

        if (!shopId || !date || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return {
                date,
                totalDuration: 0,
                slotInterval: 30,
                availableSlots: [],
            };
        }

        const shopExists = await this.findShopByIdRepository.findById(shopId);
        if (!shopExists || shopExists.status !== ShopStatus.ACTIVE) {
            return {
                date,
                totalDuration: 0,
                slotInterval: shopExists?.slotInterval || 30,
                availableSlots: [],
            };
        }

        const servicesExists = await this.findServicesRepository.findByIds(serviceIds, shopId);
        if (servicesExists.length !== serviceIds.length) {
            throw new NotFoundException('One or more services not found for this shop');
        }

        const totalDuration = servicesExists.reduce((total, service) => total + service.duration, 0);
        const slotInterval = shopExists.slotInterval || 30;
        const bufferBetweenSlots = shopExists.bufferBetweenSlots || 0;
        const shopTimeZone = shopExists.timeZone || 'America/Campo_Grande';

        // Usa meio-dia local para evitar drift de dia por timezone
        const dateRef = fromZonedTime(`${date}T12:00:00`, shopTimeZone);
        const weekday = extractWeekdayFromDateTime(dateRef, shopTimeZone) as Weekday;
        const schedule = await this.findScheduleByIdRepository.findScheduleByWeekday(weekday, shopId);

        if (!schedule || schedule.isOpen !== 'ACTIVE') {
            return {
                date,
                totalDuration,
                slotInterval,
                availableSlots: [],
            };
        }

        const shopOpenMinutes = timeToMinutes(schedule.startTime);
        const shopCloseMinutes = timeToMinutes(schedule.endTime);
        const dateOnly = getStartOfDayInTimezone(dateRef, shopTimeZone);
        const blockedTime = await this.findBlockedTimeByShopRepository.findByShopAndDate(shopId, dateOnly, undefined, shopTimeZone);
        const existingAppointments = await this.findByDateRepository.findByShopAndDate(shopId, dateRef, shopTimeZone);

        if (blockedTime?.type === BlockedTimeType.FULL_DAY) {
            return {
                date,
                totalDuration,
                slotInterval,
                availableSlots: [],
            };
        }

        const availableSlots: string[] = [];
        const now = new Date();

        for (let startMinutes = shopOpenMinutes; startMinutes < shopCloseMinutes; startMinutes += slotInterval) {
            const startTime = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
            const endMinutes = startMinutes + totalDuration;

            if (endMinutes + bufferBetweenSlots > shopCloseMinutes) {
                continue;
            }

            const endTime = addMinutesToTime(startTime, totalDuration);

            if (schedule.breakStartTime && schedule.breakEndTime) {
                if (isTimeOverlapping(startTime, endTime, schedule.breakStartTime, schedule.breakEndTime)) {
                    continue;
                }
            }

            const scheduledAt = fromZonedTime(`${date}T${startTime}:00`, shopTimeZone);
            const diffMinutes = (scheduledAt.getTime() - now.getTime()) / 60000;
            const diffDays = (scheduledAt.getTime() - now.getTime()) / (1000 * 3600 * 24);

            if (scheduledAt <= now) {
                continue;
            }

            if (diffMinutes < shopExists.minAdvanceMinutes) {
                continue;
            }

            if (diffDays > shopExists.maxAdvanceDays) {
                continue;
            }

            if (blockedTime?.type === BlockedTimeType.PARTIAL && blockedTime.startTime && blockedTime.endTime) {
                if (isTimeOverlapping(startTime, endTime, blockedTime.startTime, blockedTime.endTime)) {
                    continue;
                }
            }

            const hasConflict = existingAppointments.some((appointment) => {
                const existingStart = extractTimeFromDateTime(appointment.scheduledAt, shopTimeZone);
                const existingEnd = extractTimeFromDateTime(appointment.endTime, shopTimeZone);
                return this.hasConflictWithBuffer(
                    startTime,
                    endTime,
                    existingStart,
                    existingEnd,
                    bufferBetweenSlots,
                );
            });

            if (hasConflict) {
                continue;
            }

            availableSlots.push(startTime);
        }

        return {
            date,
            totalDuration,
            slotInterval,
            availableSlots,
        };
    }

    async execute(data: CreateAppointmentDto, currentUser?: { id?: string; role?: Role }) {
        try {
            const resolvedRole: Role | undefined = currentUser?.role;

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

            const shopClientExists = await this.findShopClienteRepository.findByShopAndUser(data.shopId, data.userId);
            if (!shopClientExists) {
                this.logger.warn(`User with ID: ${data.userId} is not a client of shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                this.logger.log(`Creating shop client relationship for user ID: ${data.userId} and shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                const shopClient = await this.createShopClientRepository.create({
                    shopId: data.shopId,
                    userId: data.userId,
                });
                this.logger.log(`Shop client relationship created with ID: ${shopClient.id}`, CreateAppointmentUseCase.name);
                
            }

            const isShopOwner = currentUser?.id
                ? shopExists.ownerId === currentUser.id || shopExists.organization?.ownerId === currentUser.id
                : false;

            const isInternalOperation = isShopOwner || resolvedRole === Role.ADMIN;

            const vehicleExists = await this.findVehicleByIdRepository.findById(data.vehicleId);
            if (!vehicleExists) {
                this.logger.warn(`Vehicle not found with ID: ${data.vehicleId}`, CreateAppointmentUseCase.name);
                throw new NotFoundException('Vehicle not found');
            }
            if (vehicleExists.userId !== data.userId) {
                this.logger.warn(`Vehicle with ID: ${data.vehicleId} does not belong to user ID: ${data.userId}`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Vehicle does not belong to the user');
            }

            const serviceIds = data.serviceIds.map(service => service.serviceId);
            const servicesExists = await this.findServicesRepository.findByIds(serviceIds, data.shopId);

            if (servicesExists.length !== serviceIds.length) {
                this.logger.warn(`One or more services not found for shop ID: ${data.shopId}`, CreateAppointmentUseCase.name);
                throw new NotFoundException('One or more services not found for this shop');
            }

            const selectedVehicleSize = vehicleExists?.size;

            const appointmentServicesSnapshot = servicesExists.map((service) => {
                let servicePrice = Number(service.price);
                let duration = service.duration;
                let vehicleSize = vehicleExists?.size;

                if (service.hasVariants) {
                    if (!selectedVehicleSize) {
                        throw new BadRequestException(`Vehicle size is required for service ${service.name}`);
                    }

                    const matchedVariant = service.variants?.find((variant) => variant.size === selectedVehicleSize);
                    if (!matchedVariant) {
                        throw new BadRequestException(`No variant found for service ${service.name} and vehicle size ${selectedVehicleSize}`);
                    }

                    servicePrice = Number(matchedVariant.price);
                    duration = matchedVariant.duration;
                    vehicleSize = matchedVariant.size;
                }

                const isBudget = Boolean(service.isBudgetOnly);
                if (isBudget) {
                    servicePrice = 0;
                }

                return {
                    serviceId: service.id,
                    serviceName: service.name,
                    servicePrice,
                    duration,
                    isBudget,
                    vehicleSize,
                };
            });

            const totalDuration = appointmentServicesSnapshot.reduce((total, service) => total + service.duration, 0);
            const totalPrice = appointmentServicesSnapshot.reduce((total, service) => total + service.servicePrice, 0);
            const shopTimeZone = shopExists.timeZone || 'America/Campo_Grande';
            const bufferBetweenSlots = shopExists.bufferBetweenSlots || 0;

            const scheduledAt = new Date(data.scheduledAt);
            const startTime = extractTimeFromDateTime(scheduledAt, shopTimeZone);
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = startMinutes + totalDuration;
            const endTime = addMinutesToTime(startTime, totalDuration);
            const endDateTime = new Date(scheduledAt.getTime() + totalDuration * 60000);
            const weekday = extractWeekdayFromDateTime(scheduledAt, shopTimeZone) as Weekday;

            const schedule = await this.findScheduleByIdRepository.findScheduleByWeekday(weekday, data.shopId);
            if (!schedule || schedule.isOpen !== 'ACTIVE') {
                this.logger.warn(`No schedule found for shop ID: ${data.shopId} on weekday: ${weekday}`, CreateAppointmentUseCase.name);
                throw new BadRequestException('Shop is closed on the selected day');
            }

            const shopOpenMinutes = timeToMinutes(schedule.startTime);
            const shopCloseMinutes = timeToMinutes(schedule.endTime);

            if (startMinutes < shopOpenMinutes) {
                throw new BadRequestException('Appointment starts before shop opens');
            }

            if (!isInternalOperation && (endMinutes + bufferBetweenSlots) > shopCloseMinutes) {
                throw new BadRequestException('Appointment ends after shop closes');
            }

            if (!isInternalOperation && schedule.breakStartTime && schedule.breakEndTime) {
                if (isTimeOverlapping(startTime, endTime, schedule.breakStartTime, schedule.breakEndTime)) {
                    throw new BadRequestException('Appointment time overlaps with shop break time');
                }
            }

            const now = new Date();
            if (!isInternalOperation && scheduledAt <= now) {
                throw new BadRequestException('Cannot schedule appointments in the past');
            }

            const diffMinutes = (scheduledAt.getTime() - now.getTime()) / 60000;
            if (!isInternalOperation && diffMinutes < shopExists.minAdvanceMinutes) {
                throw new BadRequestException(
                    `Appointment must be scheduled at least ${shopExists.minAdvanceMinutes} minutes in advance`
                );
            }

            const diffDays = (scheduledAt.getTime() - now.getTime()) / (1000 * 3600 * 24);
            if (diffDays > shopExists.maxAdvanceDays) {
                throw new BadRequestException(
                    `Appointment cannot be scheduled more than ${shopExists.maxAdvanceDays} days in advance`
                );
            }

            const dateOnly = getStartOfDayInTimezone(scheduledAt, shopTimeZone);

            const MAX_RETRIES = 2;
            let attempt = 0;
            let appointment: Awaited<ReturnType<CreateAppointmentRepository['create']>>;

            while (true) {
                try {
                    appointment = await this.prisma.$transaction(async (tx) => {
                        const blockedTime = await this.findBlockedTimeByShopRepository.findByShopAndDate(
                            data.shopId,
                            dateOnly,
                            tx,
                            shopTimeZone,
                        );

                        if (blockedTime && !isInternalOperation) {
                            if (blockedTime.type === BlockedTimeType.FULL_DAY) {
                                throw new BadRequestException(`Shop is closed on this date: ${blockedTime.reason || 'Blocked'}`);
                            }

                            if (blockedTime.type === BlockedTimeType.PARTIAL && blockedTime.startTime && blockedTime.endTime) {
                                if (isTimeOverlapping(startTime, endTime, blockedTime.startTime, blockedTime.endTime)) {
                                    throw new BadRequestException(`Time slot is blocked: ${blockedTime.reason || 'Unavailable'}`);
                                }
                            }
                        }

                        const existingAppointments = await this.findByDateRepository.findByShopAndDate(
                            data.shopId,
                            scheduledAt,
                            shopTimeZone,
                            tx,
                        );

                        for (const appointment of existingAppointments) {
                            const existingStart = extractTimeFromDateTime(appointment.scheduledAt, shopTimeZone);
                            const existingEnd = extractTimeFromDateTime(appointment.endTime, shopTimeZone);

                            if (
                                !isInternalOperation &&
                                this.hasConflictWithBuffer(
                                    startTime,
                                    endTime,
                                    existingStart,
                                    existingEnd,
                                    bufferBetweenSlots,
                                )
                            ) {
                                throw new ConflictException('Appointment time overlaps with an existing appointment');
                            }
                        }

                        const created = await this.appointmentRepository.create({
                            scheduledAt: scheduledAt.toISOString(),
                            endTime: endDateTime.toISOString(),
                            totalDuration,
                            totalPrice,
                            notes: data.notes,
                            userId: data.userId,
                            shopId: data.shopId,
                            vehicleId: data.vehicleId,
                            serviceIds: appointmentServicesSnapshot,
                        }, tx);

                        await tx.shopClient.upsert({
                            where: {
                                shopId_userId: {
                                    shopId: data.shopId,
                                    userId: data.userId,
                                },
                            },
                            update: {},
                            create: {
                                shopId: data.shopId,
                                userId: data.userId,
                            },
                        });

                        return created;
                    }, {
                        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                    });
                    break;
                } catch (txErr) {
                    const isSerializationError = (txErr as { code?: string })?.code === 'P2034';
                    if (isSerializationError && attempt < MAX_RETRIES) {
                        attempt += 1;
                        continue;
                    }
                    throw txErr;
                }
            }

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
