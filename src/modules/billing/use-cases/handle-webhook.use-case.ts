import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethod, Status } from "prisma/generated";
import { generateSlug } from "src/shared/utils";
import { PrismaService } from "src/shared/databases/prisma.database";
import {
    FindSubscriptionByAsaasIdRepository,
    SubscriptionIntentRepository,
    UpdateSubscriptionRepository,
    UpdateUserRoleRepository,
} from "../repository";
import { UpdateOrganizationRepository } from "src/modules/organization/repository";
import { AsaasWebhookDto } from "../dto/webhook.dto";

const CONFIRMED_EVENTS = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"] as const;
const OVERDUE_EVENTS = ["PAYMENT_OVERDUE"] as const;
const CANCELLED_EVENTS = [
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED",
    "PAYMENT_CHARGEBACK_REQUESTED",
    "SUBSCRIPTION_INACTIVATED",
    "SUBSCRIPTION_DELETED",
] as const;

@Injectable()
export class HandleWebhookUseCase {
    private readonly logger = new Logger(HandleWebhookUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly findSubscriptionByAsaasId: FindSubscriptionByAsaasIdRepository,
        private readonly subscriptionIntent: SubscriptionIntentRepository,
        private readonly updateSubscription: UpdateSubscriptionRepository,
        private readonly updateUserRole: UpdateUserRoleRepository,
        private readonly updateOrganization: UpdateOrganizationRepository,
    ) {}

    async execute(data: AsaasWebhookDto): Promise<void> {
        try {
            const asaasSubscriptionId = data.payment?.subscription ?? data.subscription?.id;

            if (!asaasSubscriptionId) {
                this.logger.warn(`Webhook received without subscription reference: ${data.event}`);
                return;
            }

            if ((CONFIRMED_EVENTS as readonly string[]).includes(data.event)) {
                await this.handleConfirmed(asaasSubscriptionId, data);
            } else if (
                (data.event === "SUBSCRIPTION_CREATED" || data.event === "SUBSCRIPTION_UPDATED") &&
                data.subscription?.status === "ACTIVE"
            ) {
                // Credit card: subscription activates immediately on creation — treat as payment confirmed
                await this.handleConfirmed(asaasSubscriptionId, data);
            } else if ((OVERDUE_EVENTS as readonly string[]).includes(data.event)) {
                await this.handleOverdue(asaasSubscriptionId);
            } else if ((CANCELLED_EVENTS as readonly string[]).includes(data.event)) {
                await this.handleCancelled(asaasSubscriptionId);
            } else {
                this.logger.log(`Unhandled webhook event: ${data.event}`);
            }
        } catch (err) {
            this.logger.error(`Error handling webhook event ${data.event}: ${(err as Error).message}`, (err as Error).stack);
            throw err;
        }
    }

    private async handleConfirmed(asaasSubscriptionId: string, data: AsaasWebhookDto): Promise<void> {
        // Path 1: First payment — intent exists with PENDING status
        const intent = await this.subscriptionIntent.findByAsaasSubscriptionId(asaasSubscriptionId);

        if (intent && intent.status === "PENDING") {
            await this.handleFirstPayment(intent, data);
            return;
        }

        // Path 2: Renewal / reactivation — subscription already exists locally
        const subscription = await this.findSubscriptionByAsaasId.findByAsaasId(asaasSubscriptionId);
        if (!subscription) {
            this.logger.warn(`No subscription or intent found for Asaas ID: ${asaasSubscriptionId}`);
            return;
        }

        await this.updateSubscription.update(subscription.id, { status: Status.ACTIVE });
        await this.updateOrganization.update(subscription.organizationId, { isActive: true });
        await this.updateUserRole.updateRole(subscription.organization.ownerId, "OWNER");
        await this.prisma.organizationMember.upsert({
            where: {
                userId_organizationId: {
                    userId: subscription.organization.ownerId,
                    organizationId: subscription.organizationId,
                },
            },
            create: { userId: subscription.organization.ownerId, organizationId: subscription.organizationId, role: "OWNER", isActive: true },
            update: { role: "OWNER", isActive: true },
        });

        this.logger.log(`Subscription ${subscription.id} renewed — org ${subscription.organizationId} reactivated`);
    }

    private async handleFirstPayment(
        intent: {
            id: string;
            userId: string;
            asaasCustomerId: string;
            asaasSubscriptionId: string;
            billingType: PaymentMethod;
            cycle: string;
            orgName: string;
            document: string;
        },
        _data: AsaasWebhookDto,
    ): Promise<void> {
        const existingOrg = await this.prisma.organization.findFirst({
            where: { ownerId: intent.userId },
        });

        await this.prisma.$transaction(async (tx) => {
            let orgId: string;

            if (existingOrg) {
                orgId = existingOrg.id;
                await tx.organization.update({ where: { id: orgId }, data: { isActive: true } });
                await tx.organizationMember.upsert({
                    where: { userId_organizationId: { userId: intent.userId, organizationId: orgId } },
                    create: { userId: intent.userId, organizationId: orgId, role: "OWNER", isActive: true },
                    update: { role: "OWNER", isActive: true },
                });
            } else {
                const slug = generateSlug(intent.orgName);
                const created = await tx.organization.create({
                    data: {
                        name: intent.orgName,
                        slug,
                        document: intent.document,
                        ownerId: intent.userId,
                        customerId: intent.asaasCustomerId,
                        isActive: true,
                        members: {
                            create: { userId: intent.userId, role: "OWNER" },
                        },
                    },
                });
                orgId = created.id;
            }

            await tx.subscriptions.create({
                data: {
                    organizationId: orgId,
                    subscriptionId: intent.asaasSubscriptionId,
                    status: Status.ACTIVE,
                    plan: "Plano NexoCar",
                    billingType: intent.billingType,
                    price: intent.cycle === "MONTHLY" ? 99.90 : 79.90,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });

            await tx.subscriptionIntent.update({
                where: { id: intent.id },
                data: { status: "CONFIRMED" },
            });

            await tx.user.update({
                where: { id: intent.userId },
                data: { role: "OWNER" },
            });
        });

        this.logger.log(`First payment confirmed for intent ${intent.id} — org created/reactivated, user ${intent.userId} promoted to OWNER`);
    }

    private async handleOverdue(asaasSubscriptionId: string): Promise<void> {
        const subscription = await this.findSubscriptionByAsaasId.findByAsaasId(asaasSubscriptionId);
        if (!subscription) {
            this.logger.warn(`No subscription found for OVERDUE event: ${asaasSubscriptionId}`);
            return;
        }

        await this.updateSubscription.update(subscription.id, { status: Status.OVERDUE });
        this.logger.log(`Subscription ${subscription.id} marked as OVERDUE`);
    }

    private async handleCancelled(asaasSubscriptionId: string): Promise<void> {
        const subscription = await this.findSubscriptionByAsaasId.findByAsaasId(asaasSubscriptionId);
        if (subscription) {
            // Cancela a subscription mas mantém a org ativa até o fim do período
            // Mesmo lógica do cancelamento manual
            await this.updateSubscription.update(subscription.id, {
                status: Status.CANCELLED,
                cancelledAt: new Date(),
                expiresAt: subscription.currentPeriodEnd,
            });
            this.logger.log(
                `Subscription ${subscription.id} cancelled by Asaas (vigent until ${subscription.currentPeriodEnd}) — org ${subscription.organizationId} remains active`,
            );
            return;
        }

        // Payment cancelled before org was created (intent still PENDING)
        const intent = await this.subscriptionIntent.findByAsaasSubscriptionId(asaasSubscriptionId);
        if (intent && intent.status === "PENDING") {
            await this.subscriptionIntent.updateStatus(intent.id, "FAILED");
            this.logger.log(`Intent ${intent.id} marked FAILED — payment cancelled before confirmation`);
        }
    }
}
