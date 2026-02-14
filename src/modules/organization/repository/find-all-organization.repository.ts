import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { PaginatedResult } from 'src/shared/dto/pagination.dto';

interface FindAllFilters {
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const [data, total] = await Promise.all([
            this.prisma.organization.findMany({
                skip,
                take: perPage,
                include: {
                    shops: true,
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    picture: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.organization.count(),
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
