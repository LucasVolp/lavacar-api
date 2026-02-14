import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindServiceByIdRepository {
    constructor(private readonly prisma: PrismaService){}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
            return await this.prisma.service.findUnique({
                where: { id },
                include: {
                    shop: true,
                    group: true,
                }
            });
        }

        const scope = await buildShopScope(this.prisma, user);

        return await this.prisma.service.findFirst({
            where: {
                id,
                ...scope,
            },
            include: {
                shop: true,
                group: true,
            }
        })
    }
}
