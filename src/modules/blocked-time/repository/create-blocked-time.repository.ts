import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { BlockedTimeType } from "prisma/generated";

interface CreateBlockedTimeData {
    type: BlockedTimeType;
    date: Date;
    reason?: string;
    startTime?: string;
    endTime?: string;
    shopId: string;
}

@Injectable()
export class CreateBlockedTimeRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateBlockedTimeData) {
        return await this.prisma.blockedTime.create({
            data,
            include: {
                shop: true,
            }
        });
    }

    async findByDateAndShop(date: Date, shopId: string) {
        return await this.prisma.blockedTime.findFirst({
            where: {
                date,
                shopId,
            },
        });
    }
}