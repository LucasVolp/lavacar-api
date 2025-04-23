import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateVehicleDto } from "../dto/update-vehicle.dto";

@Injectable()
export class UpdateVehicleRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateVehicleDto) {
        return await this.prisma.vehicle.update({
            where: { id },
            data,
            include: {
                appointments: true,
            },
        });
    }
}