import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindVehicleByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                appointments: true,
            },
        });
    }

}