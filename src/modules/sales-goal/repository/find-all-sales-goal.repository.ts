import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { PaginatedResult } from 'src/shared/dto/pagination.dto';
import { AppointmentStatus } from 'prisma/generated';

interface FindAllFilters {
    shopId?: string;
    organizationId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllSalesGoalRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.shopId) where.shopId = filters.shopId;
        if (filters.organizationId) where.organizationId = filters.organizationId;

        const [goals, total] = await Promise.all([
            this.prisma.salesGoal.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    shop: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
            }),
            this.prisma.salesGoal.count({ where }),
        ]);

        const goalsWithProgress = await Promise.all(
            goals.map(async (goal) => {
                const aggregation = await this.prisma.appointment.aggregate({
                    _sum: {
                        totalPrice: true,
                    },
                    where: {
                        shopId: goal.shopId || undefined,
                        status: AppointmentStatus.COMPLETED,
                        scheduledAt: {
                            gte: goal.startDate,
                            lte: goal.endDate,
                        },
                    },
                });

                return {
                    ...goal,
                    currentSales: Number(aggregation._sum?.totalPrice) || 0,
                };
            }),
        );

        return {
            data: goalsWithProgress,
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }

    async findByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}): Promise<PaginatedResult<any>> {
        return this.findAll({ shopId, ...filters });
    }

    async findByOrganizationId(organizationId: string, filters: { page?: number; perPage?: number } = {}): Promise<PaginatedResult<any>> {
        return this.findAll({ organizationId, ...filters });
    }
}
