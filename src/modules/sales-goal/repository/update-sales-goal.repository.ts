import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateSalesGoalDto } from '../dto/update-sales-goal.dto';
import { Prisma } from 'prisma/generated';

@Injectable()
export class UpdateSalesGoalRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateSalesGoalDto) {
        const { shopId, organizationId, ...updateData } = data as any; // Exclude relations from update if they accidentally passed
        
        const finalData: any = { ...updateData };
        if (data.amount !== undefined) {
            finalData.amount = new Prisma.Decimal(data.amount);
        }

        return await this.prisma.salesGoal.update({
            where: { id },
            data: finalData,
            include: {
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}
