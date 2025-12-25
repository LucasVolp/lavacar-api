import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
@Injectable()
export class FindAllEvaluationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(shopId?: string) {
        return await this.prisma.evaluation.findMany({
            where: shopId ? {
                appointment: {
                    shopId,
                }
            } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                appointment: {
                    include: {
                        services: true,
                        vehicle: true,
                        shop: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getShopStats(shopId: string) {
        const result = await this.prisma.evaluation.aggregate({
            where: {
                appointment: {
                    shopId,
                }
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        return {
            averageRating: result._avg.rating || 0,
            totalEvaluations: result._count.rating,
        };
    }
}
