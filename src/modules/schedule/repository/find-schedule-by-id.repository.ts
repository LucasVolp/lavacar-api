import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindScheduleByIdRepository {
    constructor (private readonly prisma: PrismaService) {}

    async findById(id: string) { 
        return await this.prisma.schedule.findUnique({
            where: { id },
            include: {
                shop: true
            }
        });
    }
}