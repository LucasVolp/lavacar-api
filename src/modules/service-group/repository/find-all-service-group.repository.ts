import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllServiceGroupRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(shopId?: string) {
        return await this.prisma.serviceGroup.findMany({
            where: shopId ? { shopId } : undefined,
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' }
                },
            },
            orderBy: { name: 'asc' }
        });
    }
}
