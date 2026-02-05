import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { PaginatedResult } from 'src/shared/dto/pagination.dto';

interface FindAllFilters {
    shopId?: string;
    memberId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopManagerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.shopId) where.shopId = filters.shopId;
        if (filters.memberId) where.memberId = filters.memberId;

        const [data, total] = await Promise.all([
            this.prisma.shopManager.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    shop: true,
                    member: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.shopManager.count({ where }),
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

    async findByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}): Promise<PaginatedResult<any>> {
        return this.findAll({ shopId, ...filters });
    }

    async findByMemberId(memberId: string, filters: { page?: number; perPage?: number } = {}): Promise<PaginatedResult<any>> {
        return this.findAll({ memberId, ...filters });
    }
}
