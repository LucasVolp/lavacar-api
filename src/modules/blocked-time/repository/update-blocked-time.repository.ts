import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateBlockedTimeDto } from "../dto/update-blocked-time.dto";

@Injectable()
export class UpdateBlockedTimeRepository {
    constructor (private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateBlockedTimeDto) {
        return await this.prisma.blockedTime.update({
            where: { id },
            data,
            include: {
                shop: true,
            },
        })
    }
}