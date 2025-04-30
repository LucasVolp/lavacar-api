import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateScheduleDto } from "../dto/create-schedule.dto";

@Injectable()
export class createScheduleRepository {
    constructor (private readonly prisma: PrismaService) {}

    async create(data: CreateScheduleDto) {
        return await this.prisma.schedule.create({
            data
        })
    }
}