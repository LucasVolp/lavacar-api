import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateScheduleDto } from "../dto/update-schedule.dto";

@Injectable()
export class UpdateScheduleRepository {
    constructor (private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateScheduleDto) {
        return await this.prisma.schedule.update({
            where: { id },
            data
        });
    }
}