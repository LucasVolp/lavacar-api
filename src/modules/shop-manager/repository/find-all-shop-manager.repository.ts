import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindAllShopManagerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.shopManager.findMany({
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
        });
    }

    async findByShopId(shopId: string) {
        return await this.prisma.shopManager.findMany({
            where: { shopId },
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
        });
    }

    async findByMemberId(memberId: string) {
        return await this.prisma.shopManager.findMany({
            where: { memberId },
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
        });
    }
}
