import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllBlockedTimeRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.blockedTime.findMany({
            include: {
                shop: true,
            },
        })
    }
}