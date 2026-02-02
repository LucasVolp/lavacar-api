import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindAllShopClientRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.shopClient.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findByShopId(shopId: string) {
        return await this.prisma.shopClient.findMany({
            where: { shopId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    }
}
