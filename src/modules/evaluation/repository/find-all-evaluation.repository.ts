import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope, isAdminRole } from "src/shared/security/shop-scope.util";

interface FindAllFilters {
    shopId?: string;
    userId?: string;
    rating?: number;
    page?: number;
    perPage?: number;
}

interface FindPublicFilters {
    shopId: string;
    rating?: number;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllEvaluationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: Prisma.EvaluationWhereInput = {};

        if (filters.shopId) {
            where.appointment = {
                shopId: filters.shopId,
            };
        }

        if (filters.userId) {
            where.userId = filters.userId;
        }

        if (filters.rating !== undefined) {
            where.rating = filters.rating;
        }

        if (user.role === 'USER') {
            where.userId = user.id;
        } else if (!isAdminRole(user.role)) {
            const scope = await buildShopScope(this.prisma, user, filters.shopId);
            where.appointment = {
                ...(where.appointment || {}),
                ...scope,
            };
        }

        const [data, total] = await Promise.all([
            this.prisma.evaluation.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                        }
                    },
                    appointment: {
                        include: {
                            services: true,
                            vehicle: true,
                            shop: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.evaluation.count({ where }),
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

    async getShopStats(shopId: string, user: JwtPayload) {
        const shopScope = isAdminRole(user.role)
            ? { shopId }
            : await buildShopScope(this.prisma, user, shopId);

        const where = {
            appointment: {
                ...shopScope,
            },
        };

        const [aggregate, distribution] = await Promise.all([
            this.prisma.evaluation.aggregate({
                where,
                _avg: { rating: true },
                _count: { rating: true },
            }),
            this.prisma.evaluation.groupBy({
                by: ['rating'],
                where,
                _count: { rating: true },
            }),
        ]);

        const ratingDistribution: Record<number, number> = {};
        for (const entry of distribution) {
            ratingDistribution[entry.rating] = entry._count.rating;
        }

        return {
            averageRating: aggregate._avg.rating || 0,
            totalEvaluations: aggregate._count.rating,
            ratingDistribution,
        };
    }

    async findPublicByShop(filters: FindPublicFilters): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: Prisma.EvaluationWhereInput = {
            appointment: {
                shopId: filters.shopId,
                shop: {
                    status: 'ACTIVE',
                },
            },
        };

        if (filters.rating !== undefined) {
            where.rating = filters.rating;
        }

        const [data, total] = await Promise.all([
            this.prisma.evaluation.findMany({
                where,
                skip,
                take: perPage,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    photos: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.evaluation.count({ where }),
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

    async getPublicShopStats(shopId: string) {
        const where = {
            appointment: {
                shopId,
            },
        };

        const [aggregate, distribution] = await Promise.all([
            this.prisma.evaluation.aggregate({
                where,
                _avg: { rating: true },
                _count: { rating: true },
            }),
            this.prisma.evaluation.groupBy({
                by: ['rating'],
                where,
                _count: { rating: true },
            }),
        ]);

        const ratingDistribution: Record<number, number> = {};
        for (const entry of distribution) {
            ratingDistribution[entry.rating] = entry._count.rating;
        }

        return {
            averageRating: aggregate._avg.rating || 0,
            totalEvaluations: aggregate._count.rating,
            ratingDistribution,
        };
    }
}
