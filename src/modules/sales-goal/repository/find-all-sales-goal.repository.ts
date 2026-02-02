import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindAllSalesGoalRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.salesGoal.findMany({
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findByShopId(shopId: string) {
        return await this.prisma.salesGoal.findMany({
            where: { shopId },
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findByOrganizationId(organizationId: string) {
        return await this.prisma.salesGoal.findMany({
            where: { organizationId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}
