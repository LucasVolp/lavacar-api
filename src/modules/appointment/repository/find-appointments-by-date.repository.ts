import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class FindAppointmentsByDateRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Busca agendamentos de uma loja em uma data específica
     * Usado para calcular slots disponíveis
     */
    async findByShopAndDate(shopId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await this.prisma.appointment.findMany({
            where: {
                shopId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                // Ignora agendamentos cancelados ou no-show
                status: {
                    notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
                },
            },
            select: {
                id: true,
                scheduledAt: true,
                endTime: true,
                totalDuration: true,
                status: true,
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}
