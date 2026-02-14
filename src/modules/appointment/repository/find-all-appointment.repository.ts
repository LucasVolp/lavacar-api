import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";
import { PaginatedResult } from "src/shared/dto/pagination.dto";

interface FindAllFilters {
    shopId?: string;
    userId?: string;
    status?: AppointmentStatus | AppointmentStatus[];
    startDate?: Date;
    endDate?: Date;
    page?: number;
    perPage?: number;
    sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class FindAllAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};

        if (filters.shopId) where.shopId = filters.shopId;
        if (filters.userId) where.userId = filters.userId;
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
            }
        }

        if (filters.startDate || filters.endDate) {
            where.scheduledAt = {};
            if (filters.startDate) where.scheduledAt.gte = filters.startDate;
            if (filters.endDate) where.scheduledAt.lte = filters.endDate;
        }

        const [data, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip,
                take: perPage,
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
                    evaluation: {
                        select: {
                            id: true,
                            rating: true,
                            comment: true,
                        }
                    }
                },
                orderBy: { scheduledAt: filters.sortOrder || 'asc' },
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
}
