import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";

interface FindAllFilters {
    shopId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllBlockedTimeRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.shopId) where.shopId = filters.shopId;

        const [data, total] = await Promise.all([
            this.prisma.blockedTime.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    shop: true,
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.blockedTime.count({ where }),
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