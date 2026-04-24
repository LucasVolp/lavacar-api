import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindSubscriptionByAsaasIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByAsaasId(asaasSubscriptionId: string) {
        return await this.prisma.subscriptions.findFirst({
            where: { subscriptionId: asaasSubscriptionId },
            include: {
                organization: {
                    select: {
                        id: true,
                        ownerId: true,
                        isActive: true,
                        customerId: true,
                        name: true,
                    },
                },
            },
        });
    }
}
