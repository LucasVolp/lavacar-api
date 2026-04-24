import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../billing.service';
import { CreateCheckoutUseCase } from '../use-cases/create-subscription.use-case';
import { CreateSelfCheckoutUseCase } from '../use-cases/create-self-checkout.use-case';
import { FindAllSubscriptionsUseCase } from '../use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionByIdUseCase } from '../use-cases/find-subscription-by-id.use-case';
import { UpdateSubscriptionUseCase } from '../use-cases/update-subscription.use-case';
import { HandleWebhookUseCase } from '../use-cases/handle-webhook.use-case';
import { GetBillingStatusUseCase } from '../use-cases/get-billing-status.use-case';
import { SaveWebhookEventUseCase } from '../use-cases/save-webhook-event.use-case';
import { ProcessWebhookEventUseCase } from '../use-cases/process-webhook-event.use-case';
import { CancelSubscriptionUseCase } from '../use-cases/cancel-subscription.use-case';
import { ListPaymentsUseCase } from '../use-cases/list-payments.use-case';
import { GetPaymentUseCase } from '../use-cases/get-payment.use-case';
import { GetPaymentPixQrCodeUseCase } from '../use-cases/get-payment-pix-qrcode.use-case';
import { PaymentMethod } from 'prisma/generated';

const mockCreateCheckoutUseCase = { execute: jest.fn() };
const mockCreateSelfCheckoutUseCase = { execute: jest.fn() };
const mockFindAllSubscriptionsUseCase = { execute: jest.fn() };
const mockFindSubscriptionByIdUseCase = { execute: jest.fn() };
const mockUpdateSubscriptionUseCase = { execute: jest.fn() };
const mockHandleWebhookUseCase = { execute: jest.fn() };
const mockGetBillingStatusUseCase = { execute: jest.fn() };
const mockSaveWebhookEventUseCase = { execute: jest.fn() };
const mockProcessWebhookEventUseCase = { execute: jest.fn() };
const mockCancelSubscriptionUseCase = { execute: jest.fn() };
const mockListPaymentsUseCase = { execute: jest.fn() };
const mockGetPaymentUseCase = { execute: jest.fn() };
const mockGetPaymentPixQrCodeUseCase = { execute: jest.fn() };

describe('BillingService', () => {
    let service: BillingService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                { provide: CreateCheckoutUseCase, useValue: mockCreateCheckoutUseCase },
                { provide: CreateSelfCheckoutUseCase, useValue: mockCreateSelfCheckoutUseCase },
                { provide: FindAllSubscriptionsUseCase, useValue: mockFindAllSubscriptionsUseCase },
                { provide: FindSubscriptionByIdUseCase, useValue: mockFindSubscriptionByIdUseCase },
                { provide: UpdateSubscriptionUseCase, useValue: mockUpdateSubscriptionUseCase },
                { provide: HandleWebhookUseCase, useValue: mockHandleWebhookUseCase },
                { provide: GetBillingStatusUseCase, useValue: mockGetBillingStatusUseCase },
                { provide: SaveWebhookEventUseCase, useValue: mockSaveWebhookEventUseCase },
                { provide: ProcessWebhookEventUseCase, useValue: mockProcessWebhookEventUseCase },
                { provide: CancelSubscriptionUseCase, useValue: mockCancelSubscriptionUseCase },
                { provide: ListPaymentsUseCase, useValue: mockListPaymentsUseCase },
                { provide: GetPaymentUseCase, useValue: mockGetPaymentUseCase },
                { provide: GetPaymentPixQrCodeUseCase, useValue: mockGetPaymentPixQrCodeUseCase },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSelfCheckout', () => {
        it('should delegate to CreateSelfCheckoutUseCase.execute', async () => {
            const result = { checkoutUrl: 'https://asaas.com/pay/123' };
            mockCreateSelfCheckoutUseCase.execute.mockResolvedValue(result);

            const dto = { orgName: 'Lavacar João', document: '12345678000100', billingType: PaymentMethod.PIX, cycle: 'MONTHLY' as const };
            const response = await service.createSelfCheckout('user-1', dto as any);

            expect(mockCreateSelfCheckoutUseCase.execute).toHaveBeenCalledWith('user-1', dto);
            expect(response).toBe(result);
        });
    });

    describe('handleWebhook', () => {
        it('should delegate to HandleWebhookUseCase.execute', async () => {
            mockHandleWebhookUseCase.execute.mockResolvedValue(undefined);
            const webhookDto = { event: 'PAYMENT_CONFIRMED', payment: { subscription: 'sub_123' } };

            await service.handleWebhook(webhookDto as any);

            expect(mockHandleWebhookUseCase.execute).toHaveBeenCalledWith(webhookDto);
        });
    });

    describe('getBillingStatus', () => {
        it('should delegate to GetBillingStatusUseCase.execute', async () => {
            const statusResult = { userRole: 'USER', canAccessOrganization: false, hasOrganization: false };
            mockGetBillingStatusUseCase.execute.mockResolvedValue(statusResult);

            const result = await service.getBillingStatus('user-1', 'USER');

            expect(mockGetBillingStatusUseCase.execute).toHaveBeenCalledWith('user-1', 'USER');
            expect(result).toBe(statusResult);
        });
    });

    describe('findAll', () => {
        it('should delegate to FindAllSubscriptionsUseCase.execute with pagination', async () => {
            const paginatedResult = { data: [], total: 0, page: 1, lastPage: 1 };
            mockFindAllSubscriptionsUseCase.execute.mockResolvedValue(paginatedResult);

            const result = await service.findAll('org-1', 2, 10);

            expect(mockFindAllSubscriptionsUseCase.execute).toHaveBeenCalledWith('org-1', 2, 10);
            expect(result).toBe(paginatedResult);
        });
    });

    describe('saveWebhookEvent', () => {
        it('should delegate to SaveWebhookEventUseCase.execute', async () => {
            const savedEvent = { id: 'evt-1', event: 'PAYMENT_CONFIRMED' };
            mockSaveWebhookEventUseCase.execute.mockResolvedValue(savedEvent);
            const dto = { event: 'PAYMENT_CONFIRMED', payment: { id: 'pay-1', subscription: 'sub-1' } };

            const result = await service.saveWebhookEvent(dto as any);

            expect(mockSaveWebhookEventUseCase.execute).toHaveBeenCalledWith(dto);
            expect(result).toBe(savedEvent);
        });

        it('should return null for duplicate events', async () => {
            mockSaveWebhookEventUseCase.execute.mockResolvedValue(null);

            const result = await service.saveWebhookEvent({ event: 'PAYMENT_CONFIRMED' } as any);

            expect(result).toBeNull();
        });
    });

    describe('cancelSubscription', () => {
        it('should delegate to CancelSubscriptionUseCase.execute', async () => {
            const cancelled = { id: 'sub-1', status: 'CANCELLED' };
            mockCancelSubscriptionUseCase.execute.mockResolvedValue(cancelled);

            const result = await service.cancelSubscription('sub-1');

            expect(mockCancelSubscriptionUseCase.execute).toHaveBeenCalledWith('sub-1');
            expect(result).toBe(cancelled);
        });
    });

    describe('listPayments', () => {
        it('should delegate to ListPaymentsUseCase.execute with filters', async () => {
            const payments = { data: [], totalCount: 0 };
            mockListPaymentsUseCase.execute.mockResolvedValue(payments);

            const result = await service.listPayments({ subscription: 'sub-1' });

            expect(mockListPaymentsUseCase.execute).toHaveBeenCalledWith({ subscription: 'sub-1' });
            expect(result).toBe(payments);
        });
    });
});
