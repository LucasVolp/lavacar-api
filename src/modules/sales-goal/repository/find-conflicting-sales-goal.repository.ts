import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { AppointmentStatus } from 'prisma/generated';

@Injectable()
export class FindConflictingSalesGoalRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findConflicting(
        shopId: string | undefined,
        organizationId: string | undefined,
        startDate: Date,
        endDate: Date,
    ) {
        // 1. Find temporally overlapping goals
        const conflictingGoals = await this.prisma.salesGoal.findMany({
            where: {
                shopId: shopId,
                organizationId: organizationId,
                // Overlap condition: (StartA <= EndB) and (EndA >= StartB)
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });

        if (conflictingGoals.length === 0) {
            return null; // No overlap
        }

        // 2. Check if ANY of the overlapping goals is NOT completed
        // If an overlapping goal is NOT completed, it's a conflict.
        for (const goal of conflictingGoals) {
            const aggregation = await this.prisma.appointment.aggregate({
                _sum: { totalPrice: true },
                where: {
                    shopId: goal.shopId || undefined,
                    status: AppointmentStatus.COMPLETED,
                    scheduledAt: {
                        gte: goal.startDate,
                        lte: goal.endDate,
                    },
                },
            });

            const currentSales = Number(aggregation._sum?.totalPrice) || 0;
            const targetAmount = Number(goal.amount);

            if (currentSales < targetAmount) {
                // Found a goal that overlaps and is NOT completed. This is a conflict.
                return goal;
            }
        }

        // All overlapping goals are completed. No conflict.
        return null;
    }
}
