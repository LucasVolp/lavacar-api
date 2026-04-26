import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateServiceGroupDto } from "../dto/update-service-group.dto";

@Injectable()
export class UpdateServiceGroupRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateServiceGroupDto) {
        return await this.prisma.serviceGroup.update({
            where: { id },
            data,
            include: {
                services: true,
            }
        });
    }
}
