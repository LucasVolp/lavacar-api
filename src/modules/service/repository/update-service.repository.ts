import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateServiceDto } from "../dto/update-service.dto";

@Injectable()
export class UpdateServiceRepository {
    constructor(private readonly prisma: PrismaService){}
    async update(id: string, data: UpdateServiceDto){
        return await this.prisma.service.update({
            where: {id},
            data
        })
    }
}