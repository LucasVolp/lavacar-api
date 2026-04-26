import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindScheduleByIdRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) { 
        if (!user) {
            return await this.prisma.schedule.findUnique({
                where: { id },
                include: {
                    shop: true
                }
            });
        }

        const scope = await buildShopScope(this.prisma, user);

        return await this.prisma.schedule.findFirst({
            where: { id, ...scope },
            include: {
                shop: true
            }
        });
    }
}
