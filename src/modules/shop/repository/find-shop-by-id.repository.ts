import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindShopByIdRepository {
    constructor(private readonly prisma: PrismaService){}

    async findById(id: string){
        return await this.prisma.shop.findUnique({
            where: {id},
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
        });
    }
}