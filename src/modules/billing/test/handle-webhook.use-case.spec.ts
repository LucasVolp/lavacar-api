import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HandleWebhookUseCase } from '../use-cases/handle-webhook.use-case';
import { FindSubscriptionByAsaasIdRepository } from '../repository/find-subscription-by-asaas-id.repository';
import { SubscriptionIntentRepository } from '../repository/subscription-intent.repository';
import { UpdateSubscriptionRepository } from '../repository/update-subscription.repository';
import { UpdateUserRoleRepository } from '../repository/update-user-role.repository';
import { UpdateOrganizationRepository } from 'src/modules/organization/repository';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { Status, PaymentMethod } from 'prisma/generated';

const mockPrisma = {
    organization: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    subscriptions: { create: jest.fn() },
    subscriptionIntent: { update: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn(),
};

const mockFindSubscriptionByAsaasId = { findByAsaasId: jest.fn() };
const mockSubscriptionIntent = {
    findByAsaasSubscriptionId: jest.fn(),
    updateStatus: jest.fn(),
};
const mockUpdateSubscription = { update: jest.fn() };
const mockUpdateUserRole = { updateRole: jest.fn() };
const mockUpdateOrganization = { update: jest.fn() };

const localSubscription = {
    id: 'sub-local-1',
    organizationId: 'org-1',
    organization: { ownerId: 'user-1', isActive: true },
};

const pendingIntent = {
    id: 'intent-1',
    userId: 'user-1',
    asaasCustomerId: 'cust-1',
    asaasSubscriptionId: 'asaas-sub-1',
    billingType: PaymentMethod.PIX,
    cycle: 'MONTHLY',
    orgName: 'Lavacar Central',
    document: '12345678000100',
    status: 'PENDING',
};

describe('HandleWebhookUseCase', () => {
    let useCase: HandleWebhookUseCase;

    beforeEach(async () => {
        jest.clearAllMocks();

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

        mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HandleWebhookUseCase,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: FindSubscriptionByAsaasIdRepository, useValue: mockFindSubscriptionByAsaasId },
                { provide: SubscriptionIntentRepository, useValue: mockSubscriptionIntent },
                { provide: UpdateSubscriptionRepository, useValue: mockUpdateSubscription },
                { provide: UpdateUserRoleRepository, useValue: mockUpdateUserRole },
                { provide: UpdateOrganizationRepository, useValue: mockUpdateOrganization },
            ],
        }).compile();

        useCase = module.get<HandleWebhookUseCase>(HandleWebhookUseCase);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('PAYMENT_CONFIRMED — first payment via intent', () => {
        it('should create org in transaction and promote user to OWNER', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(pendingIntent);
            mockPrisma.organization.findFirst.mockResolvedValue(null);
            mockPrisma.organization.create.mockResolvedValue({ id: 'org-new' });

            await useCase.execute({ event: 'PAYMENT_CONFIRMED', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(mockPrisma.organization.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ ownerId: 'user-1', isActive: true }),
            }));
            expect(mockPrisma.subscriptions.create).toHaveBeenCalled();
            expect(mockPrisma.subscriptionIntent.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { status: 'CONFIRMED' } }),
            );
            expect(mockPrisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { role: 'OWNER' } }),
            );
        });

        it('should reactivate existing org instead of creating a new one', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(pendingIntent);
            mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-existing' });

            await useCase.execute({ event: 'PAYMENT_CONFIRMED', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockPrisma.organization.create).not.toHaveBeenCalled();
            expect(mockPrisma.organization.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { isActive: true } }),
            );
        });

        it('should handle PAYMENT_RECEIVED the same as PAYMENT_CONFIRMED', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(pendingIntent);
            mockPrisma.organization.findFirst.mockResolvedValue(null);
            mockPrisma.organization.create.mockResolvedValue({ id: 'org-new' });

            await useCase.execute({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('PAYMENT_CONFIRMED — renewal (subscription already exists)', () => {
        it('should update subscription ACTIVE and reactivate org', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(null);
            mockFindSubscriptionByAsaasId.findByAsaasId.mockResolvedValue(localSubscription);

            await useCase.execute({ event: 'PAYMENT_CONFIRMED', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockUpdateSubscription.update).toHaveBeenCalledWith('sub-local-1', { status: Status.ACTIVE });
            expect(mockUpdateOrganization.update).toHaveBeenCalledWith('org-1', { isActive: true });
            expect(mockUpdateUserRole.updateRole).toHaveBeenCalledWith('user-1', 'OWNER');
        });
    });

    describe('PAYMENT_OVERDUE event', () => {
        it('should set subscription OVERDUE', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(null);
            mockFindSubscriptionByAsaasId.findByAsaasId.mockResolvedValue(localSubscription);

            await useCase.execute({ event: 'PAYMENT_OVERDUE', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockUpdateSubscription.update).toHaveBeenCalledWith('sub-local-1', { status: Status.OVERDUE });
            expect(mockUpdateOrganization.update).not.toHaveBeenCalled();
            expect(mockUpdateUserRole.updateRole).not.toHaveBeenCalled();
        });
    });

    describe('PAYMENT_DELETED / SUBSCRIPTION_DELETED events', () => {
        it('should set subscription CANCELLED and deactivate org when local subscription exists', async () => {
            mockFindSubscriptionByAsaasId.findByAsaasId.mockResolvedValue(localSubscription);

            await useCase.execute({ event: 'PAYMENT_DELETED', payment: { subscription: 'asaas-sub-1' } } as any);

            expect(mockUpdateSubscription.update).toHaveBeenCalledWith('sub-local-1', { status: Status.CANCELLED });
            expect(mockUpdateOrganization.update).toHaveBeenCalledWith('org-1', { isActive: false });
        });

        it('should mark intent FAILED when payment cancelled before org creation', async () => {
            mockFindSubscriptionByAsaasId.findByAsaasId.mockResolvedValue(null);
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(pendingIntent);

            await useCase.execute({ event: 'SUBSCRIPTION_DELETED', subscription: { id: 'asaas-sub-1' } } as any);

            expect(mockUpdateSubscription.update).not.toHaveBeenCalled();
            expect(mockSubscriptionIntent.updateStatus).toHaveBeenCalledWith('intent-1', 'FAILED');
        });
    });

    describe('edge cases', () => {
        it('should return without error when subscription ID is missing', async () => {
            await useCase.execute({ event: 'PAYMENT_CONFIRMED' } as any);

            expect(mockFindSubscriptionByAsaasId.findByAsaasId).not.toHaveBeenCalled();
            expect(mockUpdateSubscription.update).not.toHaveBeenCalled();
        });

        it('should not throw on unhandled events', async () => {
            mockSubscriptionIntent.findByAsaasSubscriptionId.mockResolvedValue(null);
            mockFindSubscriptionByAsaasId.findByAsaasId.mockResolvedValue(localSubscription);

            await expect(
                useCase.execute({ event: 'PAYMENT_AWAITING_RISK_ANALYSIS', payment: { subscription: 'asaas-sub-1' } } as any),
            ).resolves.toBeUndefined();

            expect(mockUpdateSubscription.update).not.toHaveBeenCalled();
        });
    });
});
