import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindServiceGroupByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
            return await this.prisma.serviceGroup.findUnique({
                where: { id },
                include: {
                    services: {
                        orderBy: { name: 'asc' }
                    },
                },
            });
        }

        const scope = await buildShopScope(this.prisma, user);

        return await this.prisma.serviceGroup.findFirst({
            where: { id, ...scope },
            include: {
                services: {
                    orderBy: { name: 'asc' }
                },
            },
        });
    }
}
