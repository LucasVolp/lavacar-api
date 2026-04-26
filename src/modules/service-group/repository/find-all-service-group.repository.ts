import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

interface FindAllFilters {
    shopId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllServiceGroupRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where = await buildShopScope(this.prisma, user, filters.shopId);

        const [data, total] = await Promise.all([
            this.prisma.serviceGroup.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    services: {
                        orderBy: { name: 'asc' }
                    },
                },
                orderBy: { name: 'asc' }
            }),
            this.prisma.serviceGroup.count({ where }),
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
