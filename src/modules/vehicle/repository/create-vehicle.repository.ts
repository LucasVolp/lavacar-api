import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateVehicleDto } from "../dto/create-vehicle.dto";

@Injectable()
export class CreateVehicleRepository{
    constructor(private readonly prisma: PrismaService){}

    async create(data: CreateVehicleDto){
        return await this.prisma.vehicle.create({
            data,
            include: {
                appointments: true,
            }
        })
    }
}