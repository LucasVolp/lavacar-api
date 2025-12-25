import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllShopRepository {
    constructor(private readonly prisma: PrismaService){}

    async findAll(){
        return await this.prisma.shop.findMany({
            include: {
                serviceGroups: {
                    select: {
                        name: true,
                        services: true,
                    }
                },
                organization: true,
                owner: true,
                schedules: true,
                blockedTimes: true,
                appointments: true,
            },
        })
    }
}