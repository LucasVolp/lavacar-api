import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { PaginatedResult } from "src/shared/dto/pagination.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

interface FindAllFilters {
    shopId?: string;
    groupId?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllServicesRepository {
    constructor(private readonly prisma: PrismaService){}

    async findAll(filters: FindAllFilters = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: Prisma.ServiceWhereInput = {};

        const scope = await buildShopScope(this.prisma, user, filters.shopId);
        Object.assign(where, scope);
        if (filters.groupId) where.groupId = filters.groupId;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.service.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    shop: true,
                    group: true,
                    variants: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.service.count({ where }),
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

    async findPublic(filters: FindAllFilters = {}): Promise<PaginatedResult<any>> {
        const page = filters.page || 1;
        const perPage = filters.perPage || 10;
        const skip = (page - 1) * perPage;

        const where: Prisma.ServiceWhereInput = {
            isActive: true,
            shop: {
                status: 'ACTIVE',
            },
        };

        if (filters.shopId) where.shopId = filters.shopId;
        if (filters.groupId) where.groupId = filters.groupId;
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.service.findMany({
                where,
                skip,
                take: perPage,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    photoUrl: true,
                    price: true,
                    duration: true,
                    isActive: true,
                    isBudgetOnly: true,
                    hasVariants: true,
                    shopId: true,
                    groupId: true,
                    createdAt: true,
                    updatedAt: true,
                    group: true,
                    variants: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.service.count({ where }),
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
