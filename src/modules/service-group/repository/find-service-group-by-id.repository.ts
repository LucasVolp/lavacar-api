import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindServiceGroupByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.serviceGroup.findUnique({
            where: { id },
            include: {
                services: {
                    orderBy: { name: 'asc' }
                },
            },
        });
    }
}
