import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateServiceGroupDto } from "../dto/create-service-group.dto";

@Injectable()
export class CreateServiceGroupRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateServiceGroupDto) {
        return await this.prisma.serviceGroup.create({
            data,
            include: {
                services: true,
            }
        });
    }
}
