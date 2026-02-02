import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateSalesGoalDto } from '../dto/create-sales-goal.dto';
import { Prisma } from 'prisma/generated';

@Injectable()
export class CreateSalesGoalRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateSalesGoalDto) {
        return await this.prisma.salesGoal.create({
            data: {
                ...data,
                amount: new Prisma.Decimal(data.amount),
            },
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
