import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindVehicleByPlateRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByPlate(plate: string) {
        return await this.prisma.vehicle.findFirst({
            where: {
                plate: {
                    equals: plate,
                    mode: 'insensitive',
                },
            },
            include: {
                user: true,
            },
        });
    }
}
