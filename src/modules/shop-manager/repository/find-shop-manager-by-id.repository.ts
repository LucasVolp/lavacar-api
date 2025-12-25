import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindShopManagerByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.shopManager.findUnique({
            where: { id },
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

    async findByShopAndMember(shopId: string, memberId: string) {
        return await this.prisma.shopManager.findUnique({
            where: {
                shopId_memberId: {
                    shopId,
                    memberId,
                },
            },
        });
    }
}
