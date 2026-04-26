import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";

@Injectable()
export class UpdateAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateAppointmentDto) {
        return await this.prisma.appointment.update({
            where: { id },
            data,
            include: {
                services: true,
                vehicle: true,
            },
        });
    }
}
