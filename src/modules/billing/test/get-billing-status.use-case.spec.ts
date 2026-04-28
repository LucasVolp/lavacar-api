import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetBillingStatusUseCase } from '../use-cases/get-billing-status.use-case';
import { FindOrganizationByOwnerRepository } from 'src/modules/organization/repository';
import { FindSubscriptionByOrganizationRepository } from '../repository/find-subscription-by-organization.repository';
import { SubscriptionIntentRepository } from '../repository/subscription-intent.repository';
import { AsaasService } from '../services/asaas.service';
import { PaymentMethod, Status } from 'prisma/generated';

const mockFindOrganizationByOwner = { findByOwnerId: jest.fn() };
const mockFindSubscription = { findByOrganizationId: jest.fn() };
const mockSubscriptionIntentRepository = { findByUserId: jest.fn() };
const mockAsaasService = {
    getSubscriptionPayments: jest.fn(),
    getPixQrCode: jest.fn(),
};

const org = { id: 'org-1', name: 'Lavacar Central', isActive: true, createdAt: new Date('2020-01-01') };

const activeSubscription = {
    id: 'sub-1',
    subscriptionId: 'asaas-sub-1',
    status: Status.ACTIVE,
    billingType: PaymentMethod.PIX,
    price: 99.90,
    nextDueDate: new Date('2026-05-09'),
    currentPeriodEnd: new Date('2026-05-09'),
};

const pendingSubscription = {
    ...activeSubscription,
    status: Status.PENDING,
};

describe('GetBillingStatusUseCase', () => {
    let useCase: GetBillingStatusUseCase;

    beforeEach(async () => {
        jest.clearAllMocks();

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetBillingStatusUseCase,
                { provide: FindOrganizationByOwnerRepository, useValue: mockFindOrganizationByOwner },
                { provide: FindSubscriptionByOrganizationRepository, useValue: mockFindSubscription },
                { provide: SubscriptionIntentRepository, useValue: mockSubscriptionIntentRepository },
                { provide: AsaasService, useValue: mockAsaasService },
            ],
        }).compile();

        useCase = module.get<GetBillingStatusUseCase>(GetBillingStatusUseCase);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('ADMIN role', () => {
        it('should always return canAccessOrganization: true regardless of subscription', async () => {
            const result = await useCase.execute('admin-1', 'ADMIN');

            expect(result.canAccessOrganization).toBe(true);
            expect(result.hasOrganization).toBe(true);
            expect(mockFindOrganizationByOwner.findByOwnerId).not.toHaveBeenCalled();
        });
    });

    describe('USER role — no organization', () => {
        it('should return hasOrganization: false when user has no org', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(null);

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(false);
            expect(result.hasOrganization).toBe(false);
        });
    });

    describe('USER role — org without subscription', () => {
        it('should return hasOrganization: true but canAccessOrganization: false', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(null);

            const result = await useCase.execute('user-1', 'USER');

            expect(result.hasOrganization).toBe(true);
            expect(result.canAccessOrganization).toBe(false);
            expect(result.organization).toMatchObject({ id: 'org-1', name: 'Lavacar Central' });
        });
    });

    describe('USER role — active subscription', () => {
        it('should return canAccessOrganization: true when subscription is ACTIVE and org is active', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(activeSubscription);

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(true);
            expect(result.subscription?.status).toBe(Status.ACTIVE);
            expect(mockAsaasService.getSubscriptionPayments).not.toHaveBeenCalled();
        });

        it('should return canAccessOrganization: false when org is inactive despite ACTIVE subscription', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue({ ...org, isActive: false });
            mockFindSubscription.findByOrganizationId.mockResolvedValue(activeSubscription);

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(false);
        });
    });

    describe('USER role — pending subscription (PIX)', () => {
        it('should fetch and return PIX QR code data', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(pendingSubscription);
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });
            mockAsaasService.getPixQrCode.mockResolvedValue({
                encodedImage: 'base64img==',
                payload: '00020126...',
                expirationDate: '2026-04-10T12:00:00Z',
            });

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(false);
            expect(result.subscription?.pixData).toMatchObject({
                encodedImage: 'base64img==',
                payload: '00020126...',
            });
            expect(mockAsaasService.getSubscriptionPayments).toHaveBeenCalledWith('asaas-sub-1');
            expect(mockAsaasService.getPixQrCode).toHaveBeenCalledWith('pay-1');
        });
    });

    describe('USER role — pending subscription (CREDIT_CARD)', () => {
        it('should return checkoutUrl for credit card subscriptions', async () => {
            const ccSub = { ...pendingSubscription, billingType: PaymentMethod.CREDIT_CARD };
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(ccSub);
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });

            const result = await useCase.execute('user-1', 'USER');

            expect(result.subscription?.checkoutUrl).toBe('https://asaas.com/invoice/pay-1');
            expect(mockAsaasService.getPixQrCode).not.toHaveBeenCalled();
        });
    });

    describe('error resilience', () => {
        it('should return fallback response when Asaas throws during status check', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(pendingSubscription);
            mockAsaasService.getSubscriptionPayments.mockRejectedValue(new Error('Asaas unavailable'));

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(false);
            expect(result.subscription?.pixData).toBeUndefined();
        });

        it('should return fallback when top-level repository throws', async () => {
            mockFindOrganizationByOwner.findByOwnerId.mockRejectedValue(new Error('DB error'));

            const result = await useCase.execute('user-1', 'USER');

            expect(result.canAccessOrganization).toBe(false);
            expect(result.hasOrganization).toBe(false);
        });
    });
});
