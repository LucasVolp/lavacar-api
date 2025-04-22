import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateServiceDto } from "../dto/create-service.dto";

@Injectable()
export class CreateServiceRepository {
    constructor(private readonly prisma: PrismaService){}
    async create(data: CreateServiceDto){
        return await this.prisma.service.create({
            data
        })
    }
}
