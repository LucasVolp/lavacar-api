import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindChecklistsByUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByUserId(userId: string, page = 1, perPage = 10) {
        const skip = (page - 1) * perPage;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.checklist.findMany({
                where: {
                    appointment: { userId },
                },
                include: {
                    appointment: {
                        select: {
                            id: true,
                            scheduledAt: true,
                            status: true,
                            totalPrice: true,
                            shop: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                            vehicle: {
                                select: {
                                    id: true,
                                    brand: true,
                                    model: true,
                                    plate: true,
                                },
                            },
                            services: {
                                select: {
                                    serviceName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: perPage,
            }),
            this.prisma.checklist.count({
                where: {
                    appointment: { userId },
                },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }
}
