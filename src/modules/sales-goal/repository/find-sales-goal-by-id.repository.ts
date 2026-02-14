import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { buildShopScope, isAdminRole } from 'src/shared/security/shop-scope.util';

@Injectable()
export class FindSalesGoalByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
            return await this.prisma.salesGoal.findUnique({
                where: { id },
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

        const where: any = { id };
        if (!isAdminRole(user.role)) {
            const scope = await buildShopScope(this.prisma, user);
            Object.assign(where, scope);
        }

        return await this.prisma.salesGoal.findFirst({
            where,
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
}
