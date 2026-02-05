import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";

interface FindAllFilters {
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: perPage,
                include: {
                    vehicles: true,
                    appointments: true,
                    shops: true
                },
            }),
            this.prisma.user.count(),
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