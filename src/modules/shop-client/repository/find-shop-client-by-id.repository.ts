import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindShopClientByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.shopClient.findUnique({
            where: { id },
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

    async findByShopAndUser(shopId: string, userId: string) {
        return await this.prisma.shopClient.findUnique({
            where: {
                shopId_userId: {
                    shopId,
                    userId,
                },
            },
        });
    }
}
