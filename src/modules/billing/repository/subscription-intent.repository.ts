import { Injectable } from "@nestjs/common";
import { PaymentMethod } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class SubscriptionIntentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByUserId(userId: string) {
        return await this.prisma.subscriptionIntent.findFirst({
            where: { userId, status: "PENDING" },
            orderBy: { createdAt: "desc" },
        });
    }

    async findByAsaasSubscriptionId(asaasSubscriptionId: string) {
        return await this.prisma.subscriptionIntent.findUnique({
            where: { asaasSubscriptionId },
        });
    }

    async create(data: {
        userId: string;
        asaasCustomerId: string;
        asaasSubscriptionId: string;
        billingType: PaymentMethod;
        cycle: string;
        orgName: string;
        document: string;
    }) {
        return await this.prisma.subscriptionIntent.create({ data });
    }

    async updateStatus(id: string, status: "CONFIRMED" | "FAILED") {
        return await this.prisma.subscriptionIntent.update({ where: { id }, data: { status } });
    }

    async updateBillingType(id: string, billingType: PaymentMethod) {
        return await this.prisma.subscriptionIntent.update({ where: { id }, data: { billingType } });
    }
}
