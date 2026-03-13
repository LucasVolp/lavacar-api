import { Injectable } from '@nestjs/common';
import { Prisma, VehicleSize, VehicleType } from 'prisma/generated';
import { PrismaService } from 'src/shared/databases/prisma.database';

export interface WalkInTransactionData {
    user: {
        id?: string;
        firstName: string;
        phone: string;
        email?: string;
    };
    vehicle: {
        id?: string;
        plate?: string;
        brand: string;
        model: string;
        color?: string;
        type: VehicleType;
        size: VehicleSize;
    };
    shopId: string;
    notes?: string;
    scheduledAt: Date;
    endTime: Date;
    totalDuration: number;
    totalPrice: number;
    services: {
        serviceId: string;
        serviceName: string;
        servicePrice: number;
        duration: number;
        isBudget: boolean;
        vehicleSize?: VehicleSize;
    }[];
}

@Injectable()
export class CreateWalkInAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: WalkInTransactionData) {
        return await this.prisma.$transaction(async (tx) => {
            // Resolve user — find existing by phone or create new
            let userId = data.user.id;
            if (!userId && data.user.phone) {
                const existing = await tx.user.findUnique({
                    where: { phone: data.user.phone },
                });
                if (existing) {
                    userId = existing.id;
                }
            }
            if (!userId) {
                const created = await tx.user.create({
                    data: {
                        firstName: data.user.firstName,
                        phone: data.user.phone,
                        email: data.user.email || undefined,
                        role: 'USER',
                        isGuest: true,
                    },
                });
                userId = created.id;
            }

            // Resolve vehicle
            let vehicleId = data.vehicle.id;
            if (!vehicleId) {
                const created = await tx.vehicle.create({
                    data: {
                        plate: data.vehicle.plate,
                        brand: data.vehicle.brand,
                        model: data.vehicle.model,
                        color: data.vehicle.color || undefined,
                        type: data.vehicle.type,
                        size: data.vehicle.size,
                        userId,
                    },
                });
                vehicleId = created.id;
            }

            // Upsert ShopClient with custom overrides
            await tx.shopClient.upsert({
                where: {
                    shopId_userId: {
                        shopId: data.shopId,
                        userId,
                    },
                },
                update: {
                    customName: data.user.firstName,
                    customPhone: data.user.phone,
                },
                create: {
                    shopId: data.shopId,
                    userId,
                    customName: data.user.firstName,
                    customPhone: data.user.phone,
                },
            });

            // Create appointment with status IN_PROGRESS (walk-in starts immediately)
            const appointment = await tx.appointment.create({
                data: {
                    scheduledAt: data.scheduledAt,
                    endTime: data.endTime,
                    totalDuration: data.totalDuration,
                    totalPrice: new Prisma.Decimal(data.totalPrice),
                    notes: data.notes || undefined,
                    status: 'IN_PROGRESS',
                    userId,
                    shopId: data.shopId,
                    vehicleId,
                    services: {
                        create: data.services.map((s) => ({
                            serviceId: s.serviceId,
                            serviceName: s.serviceName,
                            servicePrice: new Prisma.Decimal(s.servicePrice),
                            duration: s.duration,
                            isBudget: s.isBudget,
                            vehicleSize: s.vehicleSize,
                        })),
                    },
                },
                include: {
                    services: true,
                    vehicle: true,
                    shop: true,
                },
            });

            return appointment;
        });
    }
}
