import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllSubscriptionsRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async findAll (organizationId?: string, skip?: number, take?: number) {
        return await this.prisma.subscriptions.findMany({
            where: {
                organizationId: organizationId
            },
            skip: skip,
            take: take,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                organization: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            }
        });
    }

    async count (organizationId?: string) {
        return await this.prisma.subscriptions.count({
            where: {
                organizationId: organizationId
            }
        });
    }
}
