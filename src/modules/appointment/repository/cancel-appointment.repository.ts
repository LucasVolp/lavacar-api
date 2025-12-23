import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class CancelAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async cancel(id: string, reason?: string) {
        return await this.prisma.appointment.update({
            where: { id },
            data: {
                status: AppointmentStatus.CANCELED,
                cancellationReason: reason,
            },
        });
    }
}
