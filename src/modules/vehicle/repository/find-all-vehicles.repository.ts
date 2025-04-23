import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllVehiclesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.vehicle.findMany({
            include: {
                appointments: true,
            },
        });
    }
}