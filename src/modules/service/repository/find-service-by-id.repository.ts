import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindServiceByIdRepository {
    constructor(private readonly prisma: PrismaService){}

    async findById(id: string) {
        return await this.prisma.service.findUnique({
            where: {id},
            include: {
                shop: true,
            }
        })
    }
}