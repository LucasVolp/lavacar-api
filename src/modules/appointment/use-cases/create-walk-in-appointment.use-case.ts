import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { VehicleSize, VehicleType } from 'prisma/generated';
import { CreateWalkInDto } from '../dto/create-walk-in.dto';
import { CreateWalkInAppointmentRepository } from '../repository';
import { FindShopByIdRepository } from 'src/modules/shop/repository';
import { FindServicesByIdsRepository } from 'src/modules/service/repository';
import { ShopStatus } from 'src/modules/shop/types/ShopStatus';
import { addMinutes } from 'date-fns';

@Injectable()
export class CreateWalkInAppointmentUseCase {
    constructor(
        private readonly walkInRepository: CreateWalkInAppointmentRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findServicesRepository: FindServicesByIdsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateWalkInDto) {
        try {
            // 1. Validate shop
            const shop = await this.findShopByIdRepository.findById(data.shopId);
            if (!shop) {
                throw new NotFoundException('Shop not found');
            }
            if (shop.status !== ShopStatus.ACTIVE) {
                throw new BadRequestException('Shop is not active');
            }

            // 2. Validate and resolve services
            const services = await this.findServicesRepository.findByIds(data.serviceIds, data.shopId);
            if (services.length !== data.serviceIds.length) {
                throw new NotFoundException('One or more services not found for this shop');
            }

            const vehicleSize: VehicleSize = data.vehicle.size || VehicleSize.MEDIUM;

            const servicesSnapshot = services.map((service) => {
                let servicePrice = Number(service.price);
                let duration = service.duration;
                let resolvedSize: VehicleSize | undefined = vehicleSize;

                if (service.hasVariants) {
                    const variant = service.variants?.find((v) => v.size === vehicleSize);
                    if (!variant) {
                        throw new BadRequestException(
                            `No variant found for service ${service.name} and vehicle size ${vehicleSize}`,
                        );
                    }
                    servicePrice = Number(variant.price);
                    duration = variant.duration;
                    resolvedSize = variant.size;
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
                    vehicleSize: resolvedSize,
                };
            });

            const totalDuration = servicesSnapshot.reduce((sum, s) => sum + s.duration, 0);
            const totalPrice = servicesSnapshot.reduce((sum, s) => sum + s.servicePrice, 0);

            const now = new Date();
            const endTime = addMinutes(now, totalDuration);

            // 3. Normalize plate
            const normalizedPlate = data.vehicle.plate
                ? data.vehicle.plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
                : undefined;

            // 4. Delegate to repository (single transaction)
            const appointment = await this.walkInRepository.create({
                user: {
                    id: data.user.id,
                    firstName: data.user.firstName,
                    phone: data.user.phone,
                    email: data.user.email,
                },
                vehicle: {
                    id: data.vehicle.id,
                    plate: normalizedPlate,
                    brand: data.vehicle.brand,
                    model: data.vehicle.model,
                    color: data.vehicle.color,
                    type: data.vehicle.type || VehicleType.CAR,
                    size: vehicleSize,
                },
                shopId: data.shopId,
                notes: data.notes,
                scheduledAt: now,
                endTime,
                totalDuration,
                totalPrice,
                services: servicesSnapshot,
            });

            this.logger.log(
                `Walk-in appointment created with ID: ${appointment.id}`,
                CreateWalkInAppointmentUseCase.name,
            );

            return appointment;
        } catch (err) {
            if (
                err instanceof BadRequestException ||
                err instanceof NotFoundException
            ) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating walk-in appointment',
            });
            this.logger.error(error.message, (err as Error).stack, CreateWalkInAppointmentUseCase.name);
            throw error;
        }
    }
}
