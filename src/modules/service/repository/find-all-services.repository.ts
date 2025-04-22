import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllServicesRepository {
    constructor(private readonly prisma: PrismaService){}
    async findAll(){
        return await this.prisma.service.findMany({
            include: {
                shop: true,
            }
        })
    }
}