import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";

interface FindAllFilters {
    organizationId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopRepository {
    constructor(private readonly prisma: PrismaService){}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.organizationId) where.organizationId = filters.organizationId;

        const [data, total] = await Promise.all([
            this.prisma.shop.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    serviceGroups: {
                        select: {
                            name: true,
                            services: true,
                        }
                    },
                    organization: true,
                    owner: true,
                    schedules: true,
                    blockedTimes: true,
                    appointments: true,
                },
            }),
            this.prisma.shop.count({ where }),
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