import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindBlockedTimeByShopIdRepository {
    constructor(private readonly prisma: PrismaService) {} 

    async findByShopId(shopId: string) {
        return await this.prisma.blockedTime.findMany({
            where: { shopId },
            include: {
                shop: true,
            }
        });
    }

    async findByShopAndDate(shopId: string, date: Date) {
        return await this.prisma.blockedTime.findFirst({
            where: {
                shopId,
                date,
            },
        });
    }
}