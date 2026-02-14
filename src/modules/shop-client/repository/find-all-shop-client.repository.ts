import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { PaginatedResult } from 'src/shared/dto/pagination.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { buildShopScope } from 'src/shared/security/shop-scope.util';

interface FindAllFilters {
    shopId?: string;
    search?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopClientRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = await buildShopScope(this.prisma, user, filters.shopId);

        if (filters.search) {
            where.OR = [
                { customName: { contains: filters.search, mode: 'insensitive' } },
                { customPhone: { contains: filters.search, mode: 'insensitive' } },
                { customEmail: { contains: filters.search, mode: 'insensitive' } },
                { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
                { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
                { user: { phone: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.shopClient.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            picture: true,
                            vehicles: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    plate: true,
                                    brand: true,
                                    model: true,
                                    year: true,
                                    color: true,
                                    type: true,
                                },
                            },
                        },
                    },
                    shop: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.shopClient.count({ where }),
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

    async findByShopId(shopId: string, filters: { search?: string; page?: number; perPage?: number } = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = await buildShopScope(this.prisma, user, shopId);

        if (filters.search) {
            where.OR = [
                { customName: { contains: filters.search, mode: 'insensitive' } },
                { customPhone: { contains: filters.search, mode: 'insensitive' } },
                { customEmail: { contains: filters.search, mode: 'insensitive' } },
                { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
                { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
                { user: { email: { contains: filters.search, mode: 'insensitive' } } },
                { user: { phone: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.shopClient.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            picture: true,
                            vehicles: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    plate: true,
                                    brand: true,
                                    model: true,
                                    year: true,
                                    color: true,
                                    type: true,
                                },
                            },
                            appointments: {
                                where: { shopId },
                                orderBy: { scheduledAt: 'desc' },
                                take: 10,
                                select: {
                                    id: true,
                                    scheduledAt: true,
                                    status: true,
                                    totalPrice: true,
                                    services: {
                                        select: {
                                            serviceName: true,
                                        },
                                    },
                                },
                            },
                            evaluations: {
                                where: {
                                    appointment: {
                                        shopId,
                                    },
                                },
                                orderBy: { createdAt: 'desc' },
                                take: 5,
                                select: {
                                    id: true,
                                    rating: true,
                                    comment: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.shopClient.count({ where }),
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

    async countByShopId(shopId: string, user: JwtPayload) {
        const where = await buildShopScope(this.prisma, user, shopId);
        return await this.prisma.shopClient.count({
            where,
        });
    }
}
