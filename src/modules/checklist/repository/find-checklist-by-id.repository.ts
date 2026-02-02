import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindChecklistByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.checklist.findUnique({
            where: { id },
            include: {
                appointment: true,
            },
        });
    }

    async findByAppointmentId(appointmentId: string) {
        return await this.prisma.checklist.findUnique({
            where: { appointmentId },
            include: {
                appointment: true,
            },
        });
    }
}
