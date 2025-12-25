import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class DeleteServiceGroupRepository {
    constructor(private readonly prisma: PrismaService) {}

    async delete(id: string) {
        return await this.prisma.serviceGroup.delete({
            where: { id },
            include: {
                services: true,
            }
        });
    }
}
