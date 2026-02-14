import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { buildShopScope } from 'src/shared/security/shop-scope.util';

@Injectable()
export class FindShopClientByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
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
                            picture: true,
                            vehicles: true,
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

        const scope = await buildShopScope(this.prisma, user);

        return await this.prisma.shopClient.findFirst({
            where: { id, ...scope },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        picture: true,
                        vehicles: true,
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
