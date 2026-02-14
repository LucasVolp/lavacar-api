import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";
import { getStartOfDayInTimezone, getEndOfDayInTimezone } from "src/shared/utils";

@Injectable()
export class FindAppointmentsByDateRepository {
    constructor(private readonly prisma: PrismaService) {}
    async findByShopAndDate(
        shopId: string,
        date: Date,
        timeZone?: string,
        dbClient?: Prisma.TransactionClient,
    ) {
        const db = dbClient ?? this.prisma;
        const startOfDay = getStartOfDayInTimezone(date, timeZone);
        const endOfDay = getEndOfDayInTimezone(date, timeZone);

        return await db.appointment.findMany({
            where: {
                shopId,
                shop: {
                    status: 'ACTIVE',
                },
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
                },
            },
            select: {
                scheduledAt: true,
                endTime: true,
                totalDuration: true,
                status: true,
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}
