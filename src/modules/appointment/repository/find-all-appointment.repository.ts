import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";

interface FindAllFilters {
    shopId?: string;
    userId?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class FindAllAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}) {
        const where: any = {};

        if (filters.shopId) where.shopId = filters.shopId;
        if (filters.userId) where.userId = filters.userId;
        if (filters.status) where.status = filters.status;

        if (filters.startDate || filters.endDate) {
            where.scheduledAt = {};
            if (filters.startDate) where.scheduledAt.gte = filters.startDate;
            if (filters.endDate) where.scheduledAt.lte = filters.endDate;
        }

        return await this.prisma.appointment.findMany({
            where,
            include: {
                services: true,
                vehicle: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}
