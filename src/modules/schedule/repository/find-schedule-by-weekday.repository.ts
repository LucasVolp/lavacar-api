import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { Weekday } from "prisma/generated";

@Injectable()
export class FindScheduleByWeekdayRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findScheduleByWeekday(weekday: Weekday, shopId: string) {
        return await this.prisma.schedule.findUnique({
            where: { 
                weekday_shopId: {
                    weekday,
                    shopId
                }
            },
        });
    }

    async findAllByShop(shopId: string) {
        return await this.prisma.schedule.findMany({
            where: { shopId },
            orderBy: { weekday: 'asc' }
        });
    }
}