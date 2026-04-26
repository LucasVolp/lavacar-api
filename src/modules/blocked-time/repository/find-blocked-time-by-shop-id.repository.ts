import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { formatInTimeZone } from "date-fns-tz";

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

    async findByShopAndDate(
        shopId: string,
        date: Date,
        dbClient?: Prisma.TransactionClient,
        timeZone: string = 'America/Sao_Paulo',
    ) {
        const db = dbClient ?? this.prisma;
        const dateKey = formatInTimeZone(date, timeZone, "yyyy-MM-dd");
        const normalizedDate = new Date(`${dateKey}T00:00:00.000Z`);

        return await db.blockedTime.findFirst({
            where: {
                shopId,
                date: normalizedDate,
            },
        });
    }
}
