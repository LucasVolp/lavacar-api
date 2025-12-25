import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindServicesByIdsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByIds(ids: string[], shopId: string) {
        return await this.prisma.service.findMany({
            where: {
                id: { in: ids },
                shopId: shopId, // Garante que pertencem ao shop
                isActive: true, // Só serviços ativos
            },
        });
    }
}