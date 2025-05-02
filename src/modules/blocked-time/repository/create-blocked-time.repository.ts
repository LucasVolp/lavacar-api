import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateBlockedTimeDto } from "../dto/create-blocked-time.dto";

@Injectable()
export class CreateBlockedTimeRepository {
    constructor (private readonly prisma: PrismaService) {}

    async create(data: CreateBlockedTimeDto) {
        return await this.prisma.blockedTime.create({
            data,
            include: {
                shop: true,
            },
        })
    }
}