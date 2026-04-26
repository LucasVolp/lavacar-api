import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { AppointmentStatus } from 'prisma/generated';

@Injectable()
export class FindAppointmentsByVehiclePlateRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findUpcomingByPlateAndShop(plate: string, shopId: string) {
        const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

        return this.prisma.appointment.findMany({
            where: {
                shopId,
                vehicle: {
                    plate: {
                        equals: normalizedPlate,
                        mode: 'insensitive',
                    },
                },
                status: {
                    in: [
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.WAITING,
                    ],
                },
                scheduledAt: {
                    gte: new Date(),
                },
            },
            include: {
                vehicle: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        phone: true,
                    },
                },
                services: true,
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}
