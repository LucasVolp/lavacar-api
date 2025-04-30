import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { Weekday } from "../types/Weekday";

@Injectable()
export class FindScheduleByWeekdayRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findScheduleByWeekday(weekday: Weekday) {
        return await this.prisma.schedule.findFirst({
            where: { weekday },
            include: {
                shop: true
            }
        })
    }
}