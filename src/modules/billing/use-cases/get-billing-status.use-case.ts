import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethod, Status } from "prisma/generated";
import { FindOrganizationByOwnerRepository } from "src/modules/organization/repository";
import { FindSubscriptionByOrganizationRepository, SubscriptionIntentRepository } from "../repository";
import { AsaasService } from "../services/asaas.service";

export interface PixData {
    encodedImage: string;
    payload: string;
    expirationDate: string;
}

export interface SubscriptionStatus {
    id: string;
    status: Status;
    billingType: PaymentMethod;
    price: number;
    nextDueDate?: Date;
    currentPeriodEnd: Date;
    checkoutUrl?: string;
    pixData?: PixData;
}

export interface TrialInfo {
    isActive: boolean;
    endsAt: string;
    daysRemaining: number;
}

export interface BillingStatusResponse {
    userRole: string;
    canAccessOrganization: boolean;
    hasOrganization: boolean;
    organization?: {
        id: string;
        name: string;
        isActive: boolean;
        createdAt?: string;
        document?: string;
    };
    subscription?: SubscriptionStatus;
    trial?: TrialInfo;
}

@Injectable()
export class GetBillingStatusUseCase {
    private readonly logger = new Logger(GetBillingStatusUseCase.name);

    constructor(
        private readonly findOrganizationByOwner: FindOrganizationByOwnerRepository,
        private readonly findSubscription: FindSubscriptionByOrganizationRepository,
        private readonly subscriptionIntentRepository: SubscriptionIntentRepository,
        private readonly asaasService: AsaasService,
    ) {}

    async execute(userId: string, userRole: string): Promise<BillingStatusResponse> {
        try {
            if (userRole === "ADMIN") {
                return { userRole, canAccessOrganization: true, hasOrganization: true };
            }

            const organization = await this.findOrganizationByOwner.findByOwnerId(userId);

            if (!organization) {
                const pendingIntent = await this.subscriptionIntentRepository.findByUserId(userId);
                if (pendingIntent) {
                    const checkoutData = await this.fetchCheckoutData(pendingIntent.asaasSubscriptionId, pendingIntent.billingType);
                    return {
                        userRole,
                        canAccessOrganization: false,
                        hasOrganization: false,
                        subscription: {
                            id: pendingIntent.id,
                            status: Status.PENDING,
                            billingType: pendingIntent.billingType,
                            price: pendingIntent.cycle === "MONTHLY" ? 99.90 : 79.90,
                            nextDueDate: undefined,
                            currentPeriodEnd: new Date(),
                            ...checkoutData,
                        },
                    };
                }
                return { userRole, canAccessOrganization: false, hasOrganization: false };
            }

            const subscription = await this.findSubscription.findByOrganizationId(organization.id);

            const orgInfo = {
                id: organization.id,
                name: organization.name,
                isActive: organization.isActive,
                createdAt: organization.createdAt.toISOString(),
                document: organization.document ?? undefined,
            };

            if (!subscription) {
                const now = new Date();
                const trialEndsAt = new Date(organization.createdAt);
                trialEndsAt.setDate(trialEndsAt.getDate() + 15);
                const isTrialActive = now < trialEndsAt;
                const daysRemaining = Math.max(
                    0,
                    Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000),
                );

                return {
                    userRole,
                    canAccessOrganization: isTrialActive,
                    hasOrganization: true,
                    organization: orgInfo,
                    trial: { isActive: isTrialActive, endsAt: trialEndsAt.toISOString(), daysRemaining },
                };
            }

            const now = new Date();
            const isExpired: boolean = subscription.expiresAt ? subscription.expiresAt <= now : false;
            const isCancelledButVigent: boolean =
                subscription.status === Status.CANCELLED &&
                !!(subscription.expiresAt && subscription.expiresAt > now);

            const isActive: boolean = !isExpired && organization.isActive === true &&
                (subscription.status === Status.ACTIVE || isCancelledButVigent);

            const baseResponse: BillingStatusResponse = {
                userRole,
                canAccessOrganization: isActive,
                hasOrganization: true,
                organization: orgInfo,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    billingType: subscription.billingType,
                    price: subscription.price,
                    nextDueDate: subscription.nextDueDate ?? undefined,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                },
            };

            if (subscription.status === Status.PENDING || subscription.status === Status.OVERDUE) {
                const checkoutData = await this.fetchCheckoutData(
                    subscription.subscriptionId,
                    subscription.billingType,
                );
                baseResponse.subscription = { ...baseResponse.subscription!, ...checkoutData };
            }

            return baseResponse;
        } catch (err) {
            this.logger.error(`Error getting billing status for user ${userId}: ${(err as Error).message}`);
            return { userRole, canAccessOrganization: false, hasOrganization: false };
        }
    }

    private async fetchCheckoutData(
        asaasSubscriptionId: string,
        billingType: PaymentMethod,
    ): Promise<{ checkoutUrl?: string; pixData?: PixData }> {
        try {
            const payments = await this.asaasService.getSubscriptionPayments(asaasSubscriptionId);

            if (!payments.data || payments.data.length === 0) return {};

            const latestPayment = payments.data[0];

            if (billingType === PaymentMethod.PIX) {
                const pixData = await this.asaasService.getPixQrCode(latestPayment.id);
                return {
                    pixData: {
                        encodedImage: pixData.encodedImage as string,
                        payload: pixData.payload as string,
                        expirationDate: pixData.expirationDate as string,
                    },
                };
            }

            return { checkoutUrl: latestPayment.invoiceUrl as string };
        } catch {
            return {};
        }
    }
}
