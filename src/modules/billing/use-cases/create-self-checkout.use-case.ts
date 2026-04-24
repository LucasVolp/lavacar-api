import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from "@nestjs/common";
import { PaymentMethod, Status } from "prisma/generated";
import { FindOrganizationByOwnerRepository, UpdateOrganizationRepository } from "src/modules/organization/repository";
import { FindUserRepository } from "src/modules/users/repository";
import {
    CreateSubscriptionRepository,
    FindSubscriptionByOrganizationRepository,
    SubscriptionIntentRepository,
    UpdateSubscriptionRepository,
} from "../repository";
import { AsaasService } from "../services/asaas.service";
import { CreateSelfCheckoutDto } from "../dto/create-self-checkout.dto";

@Injectable()
export class CreateSelfCheckoutUseCase {
    private readonly logger = new Logger(CreateSelfCheckoutUseCase.name);

    private static readonly PLAN_PRICES: Record<"MONTHLY" | "ANNUALLY", number> = {
        MONTHLY: 99.90,
        ANNUALLY: 79.90,
    };

    constructor(
        private readonly findUser: FindUserRepository,
        private readonly findOrganizationByOwner: FindOrganizationByOwnerRepository,
        private readonly updateOrganization: UpdateOrganizationRepository,
        private readonly findSubscription: FindSubscriptionByOrganizationRepository,
        private readonly createSubscription: CreateSubscriptionRepository,
        private readonly updateSubscription: UpdateSubscriptionRepository,
        private readonly subscriptionIntent: SubscriptionIntentRepository,
        private readonly asaasService: AsaasService,
    ) {}

    private mapAsaasStatusToPrisma(asaasStatus: string): Status {
        const map: Record<string, Status> = {
            ACTIVE: Status.ACTIVE,
            INACTIVE: Status.EXPIRED,
            EXPIRED: Status.EXPIRED,
            CANCELLED: Status.CANCELLED,
            OVERDUE: Status.OVERDUE,
            PENDING: Status.PENDING,
            TRIAL: Status.ACTIVE,
        };
        return map[asaasStatus] ?? Status.PENDING;
    }

    async execute(userId: string, data: CreateSelfCheckoutDto) {
        try {
            const user = await this.findUser.findById(userId);
            if (!user) throw new NotFoundException("Usuário não encontrado");

            if (!user.email || !user.phone) {
                throw new BadRequestException("E-mail e telefone são obrigatórios para criar o cliente de cobrança");
            }

            const existingOrg = await this.findOrganizationByOwner.findByOwnerId(userId);

            if (existingOrg) {
                const existingSubscription = await this.findSubscription.findByOrganizationId(existingOrg.id);

                if (existingSubscription?.status === Status.ACTIVE) {
                    throw new ConflictException("Você já possui uma assinatura ativa");
                }

                if (
                    existingSubscription?.status === Status.PENDING ||
                    existingSubscription?.status === Status.OVERDUE
                ) {
                    return await this.resolveExistingCheckout(existingSubscription, data.billingType);
                }

                // CANCELLED / EXPIRED: reactivation path — reuse existing org and customerId
                return await this.handleReactivation(userId, user, existingOrg, data);
            }

            // No org — check for existing PENDING intent to avoid duplicate on retry
            const existingIntent = await this.subscriptionIntent.findByUserId(userId);
            if (existingIntent) {
                return await this.resolveExistingIntentCheckout(existingIntent, data.billingType);
            }

            // New user — no org yet: create intent only (org created post-payment via webhook)
            return await this.handleNewCheckout(userId, user, data);
        } catch (err: unknown) {
            if (
                err instanceof NotFoundException ||
                err instanceof ConflictException ||
                err instanceof BadRequestException ||
                err instanceof ServiceUnavailableException
            ) {
                throw err;
            }

            this.logger.error(`Error in CreateSelfCheckoutUseCase: ${(err as Error).message}`);
            throw new ServiceUnavailableException("Erro ao processar o checkout. Tente novamente.");
        }
    }

    private async handleNewCheckout(
        userId: string,
        user: { firstName: string; lastName?: string | null; email: string | null; phone: string },
        data: CreateSelfCheckoutDto,
    ) {
        const customerResponse = await this.asaasService.createCustomer(
            {
                name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`,
                cpfCnpj: data.document.replace(/\D/g, ""),
                email: user.email!,
                mobilePhone: user.phone.replace(/\D/g, ""),
            },
            `cust_user_${userId}`,
        );

        const planValue = CreateSelfCheckoutUseCase.PLAN_PRICES[data.cycle];

        const subscriptionResponse = await this.asaasService.createSubscription(
            {
                customer: customerResponse.id,
                billingType: data.billingType,
                cycle: data.cycle,
                value: planValue,
            },
            `sub_user_${userId}`,
        );

        await this.subscriptionIntent.create({
            userId,
            asaasCustomerId: customerResponse.id,
            asaasSubscriptionId: subscriptionResponse.id,
            billingType: data.billingType,
            cycle: data.cycle,
            orgName: data.orgName,
            document: data.document,
        });

        return await this.buildCheckoutResponse(subscriptionResponse, data.billingType);
    }

    private async handleReactivation(
        userId: string,
        user: { firstName: string; lastName?: string | null; email: string | null; phone: string },
        existingOrg: { id: string; customerId?: string | null },
        data: CreateSelfCheckoutDto,
    ) {
        let customerId = existingOrg.customerId;

        if (!customerId) {
            const customerResponse = await this.asaasService.createCustomer(
                {
                    name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`,
                    cpfCnpj: data.document.replace(/\D/g, ""),
                    email: user.email!,
                    mobilePhone: user.phone.replace(/\D/g, ""),
                },
                `cust_user_${userId}`,
            );
            customerId = customerResponse.id;
            await this.updateOrganization.update(existingOrg.id, { customerId: customerId ?? undefined });
        }

        const planValue = CreateSelfCheckoutUseCase.PLAN_PRICES[data.cycle];

        const subscriptionResponse = await this.asaasService.createSubscription(
            {
                customer: customerId!,
                billingType: data.billingType,
                cycle: data.cycle,
                value: planValue,
            },
        );

        await this.createSubscription.create({
            organizationId: existingOrg.id,
            subscriptionId: subscriptionResponse.id,
            status: this.mapAsaasStatusToPrisma(subscriptionResponse.status),
            plan: subscriptionResponse.description || "Plano NexoCar",
            billingType: subscriptionResponse.billingType as PaymentMethod,
            price: subscriptionResponse.value,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(subscriptionResponse.nextDueDate),
            nextDueDate: new Date(subscriptionResponse.nextDueDate),
        });

        return await this.buildCheckoutResponse(subscriptionResponse, data.billingType);
    }

    private async buildCheckoutResponse(
        subscriptionResponse: { id: string; billingType?: string },
        requestedBillingType: PaymentMethod,
    ) {
        const paymentsResponse = await this.asaasService.getSubscriptionPayments(subscriptionResponse.id);

        if (!paymentsResponse.data || paymentsResponse.data.length === 0) {
            return { subscriptionId: subscriptionResponse.id };
        }

        const firstPayment = paymentsResponse.data[0];

        if (requestedBillingType === PaymentMethod.CREDIT_CARD) {
            return { checkoutUrl: firstPayment.invoiceUrl as string };
        }

        if (requestedBillingType === PaymentMethod.PIX) {
            const pixData = await this.asaasService.getPixQrCode(firstPayment.id);
            return {
                encodedImage: pixData.encodedImage as string,
                payload: pixData.payload as string,
                expirationDate: pixData.expirationDate as string,
            };
        }

        return { subscriptionId: subscriptionResponse.id };
    }

    private async resolveExistingIntentCheckout(
        intent: { id: string; billingType: PaymentMethod; asaasSubscriptionId: string },
        requestedBillingType: PaymentMethod,
    ) {
        if (intent.billingType !== requestedBillingType) {
            await this.asaasService.updateSubscriptionBillingType(
                intent.asaasSubscriptionId,
                requestedBillingType,
                `upd_intent_${intent.id}_${requestedBillingType}`,
            );
            await this.subscriptionIntent.updateBillingType(intent.id, requestedBillingType);
        }
        return await this.buildCheckoutResponse({ id: intent.asaasSubscriptionId }, requestedBillingType);
    }

    private async resolveExistingCheckout(
        subscription: {
            id: string;
            subscriptionId: string;
            billingType: PaymentMethod;
        },
        requestedBillingType: PaymentMethod,
    ) {
        if (subscription.billingType !== requestedBillingType) {
            await this.asaasService.updateSubscriptionBillingType(
                subscription.subscriptionId,
                requestedBillingType,
                `upd_sub_${subscription.id}_${requestedBillingType}`,
            );
            await this.updateSubscription.update(subscription.id, { billingType: requestedBillingType });
        }

        const payments = await this.asaasService.getSubscriptionPayments(subscription.subscriptionId);

        if (!payments.data || payments.data.length === 0) {
            throw new ServiceUnavailableException("Nenhum pagamento encontrado para a assinatura existente");
        }

        const latestPayment = payments.data[0];
        const effectiveBillingType = requestedBillingType !== subscription.billingType
            ? requestedBillingType
            : subscription.billingType;

        if (effectiveBillingType === PaymentMethod.CREDIT_CARD) {
            return { checkoutUrl: latestPayment.invoiceUrl as string };
        }

        if (effectiveBillingType === PaymentMethod.PIX) {
            const pixData = await this.asaasService.getPixQrCode(latestPayment.id);
            return {
                encodedImage: pixData.encodedImage as string,
                payload: pixData.payload as string,
                expirationDate: pixData.expirationDate as string,
            };
        }

        return { checkoutUrl: latestPayment.invoiceUrl as string };
    }
}
