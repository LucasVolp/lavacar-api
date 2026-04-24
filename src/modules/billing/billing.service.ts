import { Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-customer.dto';
import { CreateAsaasSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSelfCheckoutDto } from './dto/create-self-checkout.dto';
import { AsaasWebhookDto } from './dto/webhook.dto';
import { PaymentMethod } from 'prisma/generated';
import {
    CancelSubscriptionUseCase,
    CreateCheckoutUseCase,
    CreateSelfCheckoutUseCase,
    FindAllSubscriptionsUseCase,
    FindSubscriptionByIdUseCase,
    GetBillingStatusUseCase,
    GetPaymentPixQrCodeUseCase,
    GetPaymentUseCase,
    HandleWebhookUseCase,
    ListPaymentsUseCase,
    ProcessWebhookEventUseCase,
    SaveWebhookEventUseCase,
    UpdateSubscriptionUseCase,
} from './use-cases';

@Injectable()
export class BillingService {
    constructor(
        private readonly createCheckoutUseCase: CreateCheckoutUseCase,
        private readonly createSelfCheckoutUseCase: CreateSelfCheckoutUseCase,
        private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
        private readonly findSubscriptionByIdUseCase: FindSubscriptionByIdUseCase,
        private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
        private readonly handleWebhookUseCase: HandleWebhookUseCase,
        private readonly getBillingStatusUseCase: GetBillingStatusUseCase,
        private readonly saveWebhookEventUseCase: SaveWebhookEventUseCase,
        private readonly processWebhookEventUseCase: ProcessWebhookEventUseCase,
        private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
        private readonly listPaymentsUseCase: ListPaymentsUseCase,
        private readonly getPaymentUseCase: GetPaymentUseCase,
        private readonly getPaymentPixQrCodeUseCase: GetPaymentPixQrCodeUseCase,
    ) {}

    createCheckout(organizationId: string, billing: CreateBillingDto, asaas: CreateAsaasSubscriptionDto) {
        return this.createCheckoutUseCase.execute(organizationId, billing, asaas);
    }

    createSelfCheckout(userId: string, data: CreateSelfCheckoutDto) {
        return this.createSelfCheckoutUseCase.execute(userId, data);
    }

    findAll(organizationId?: string, page?: number, limit?: number) {
        return this.findAllSubscriptionsUseCase.execute(organizationId, page, limit);
    }

    findById(id: string) {
        return this.findSubscriptionByIdUseCase.execute(id);
    }

    updateSubscription(id: string, billingType: PaymentMethod) {
        return this.updateSubscriptionUseCase.execute(id, billingType);
    }

    handleWebhook(data: AsaasWebhookDto) {
        return this.handleWebhookUseCase.execute(data);
    }

    getBillingStatus(userId: string, userRole: string) {
        return this.getBillingStatusUseCase.execute(userId, userRole);
    }

    saveWebhookEvent(dto: AsaasWebhookDto) {
        return this.saveWebhookEventUseCase.execute(dto);
    }

    processWebhookEvent(webhookEventId: string) {
        return this.processWebhookEventUseCase.execute(webhookEventId);
    }

    cancelSubscription(subscriptionId: string) {
        return this.cancelSubscriptionUseCase.execute(subscriptionId);
    }

    listPayments(filters?: { subscription?: string; status?: string }) {
        return this.listPaymentsUseCase.execute(filters);
    }

    getPayment(paymentId: string) {
        return this.getPaymentUseCase.execute(paymentId);
    }

    getPaymentPixQrCode(paymentId: string) {
        return this.getPaymentPixQrCodeUseCase.execute(paymentId);
    }
}
