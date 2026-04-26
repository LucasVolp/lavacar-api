import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindShopClientByShopAndUserRepository {
    constructor(private readonly prisma: PrismaService) {}

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
