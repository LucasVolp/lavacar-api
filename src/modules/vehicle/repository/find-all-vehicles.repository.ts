import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";

interface FindAllFilters {
    userId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllVehiclesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.userId) where.userId = filters.userId;

        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    appointments: true,
                    user: true
                },
            }),
            this.prisma.vehicle.count({ where }),
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