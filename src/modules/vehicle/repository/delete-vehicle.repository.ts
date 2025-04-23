import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class DeleteVehicleRepository {
    constructor(private readonly prisma: PrismaService) {}

    async delete(id: string) {
        return await this.prisma.vehicle.delete({
            where: { id },
            include: {
                appointments: true,
            },
        });
    }
}