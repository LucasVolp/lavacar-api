import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CreateSelfCheckoutUseCase } from '../use-cases/create-self-checkout.use-case';
import { FindUserRepository } from 'src/modules/users/repository';
import { FindOrganizationByOwnerRepository, UpdateOrganizationRepository } from 'src/modules/organization/repository';
import {
    CreateSubscriptionRepository,
    FindSubscriptionByOrganizationRepository,
    SubscriptionIntentRepository,
    UpdateSubscriptionRepository,
} from '../repository';
import { AsaasService } from '../services/asaas.service';
import { PaymentMethod, Status } from 'prisma/generated';

const mockFindUser = { findById: jest.fn() };
const mockFindOrganizationByOwner = { findByOwnerId: jest.fn() };
const mockUpdateOrganization = { update: jest.fn() };
const mockFindSubscription = { findByOrganizationId: jest.fn() };
const mockCreateSubscription = { create: jest.fn() };
const mockUpdateSubscription = { update: jest.fn() };
const mockSubscriptionIntent = { create: jest.fn() };
const mockAsaasService = {
    createCustomer: jest.fn(),
    createSubscription: jest.fn(),
    getSubscriptionPayments: jest.fn(),
    getPixQrCode: jest.fn(),
    updateSubscriptionBillingType: jest.fn(),
};

const user = { id: 'user-1', firstName: 'João', lastName: 'Silva', email: 'joao@email.com', phone: '11999990000' };

const activeSubscription = {
    id: 'sub-1',
    subscriptionId: 'asaas-sub-1',
    status: Status.ACTIVE,
    billingType: PaymentMethod.PIX,
};

const pendingSubscription = { ...activeSubscription, status: Status.PENDING };
const cancelledSubscription = { ...activeSubscription, status: Status.CANCELLED };

const org = { id: 'org-1', customerId: 'cust-1', isActive: false };

const dto = { orgName: 'Lavacar Central', document: '12345678000100', billingType: PaymentMethod.PIX, cycle: 'MONTHLY' as const };

describe('CreateSelfCheckoutUseCase', () => {
    let useCase: CreateSelfCheckoutUseCase;

    beforeEach(async () => {
        jest.clearAllMocks();

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateSelfCheckoutUseCase,
                { provide: FindUserRepository, useValue: mockFindUser },
                { provide: FindOrganizationByOwnerRepository, useValue: mockFindOrganizationByOwner },
                { provide: UpdateOrganizationRepository, useValue: mockUpdateOrganization },
                { provide: FindSubscriptionByOrganizationRepository, useValue: mockFindSubscription },
                { provide: CreateSubscriptionRepository, useValue: mockCreateSubscription },
                { provide: UpdateSubscriptionRepository, useValue: mockUpdateSubscription },
                { provide: SubscriptionIntentRepository, useValue: mockSubscriptionIntent },
                { provide: AsaasService, useValue: mockAsaasService },
            ],
        }).compile();

        useCase = module.get<CreateSelfCheckoutUseCase>(CreateSelfCheckoutUseCase);
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('user not found', () => {
        it('should throw NotFoundException', async () => {
            mockFindUser.findById.mockResolvedValue(null);

            await expect(useCase.execute('user-1', dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('new user — no org', () => {
        it('should create intent and NOT call createOrganization', async () => {
            mockFindUser.findById.mockResolvedValue(user);
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(null);
            mockAsaasService.createCustomer.mockResolvedValue({ id: 'cust-new' });
            mockAsaasService.createSubscription.mockResolvedValue({
                id: 'asaas-sub-new', status: 'PENDING', billingType: 'PIX', value: 99.90, nextDueDate: '2026-05-09',
            });
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });
            mockAsaasService.getPixQrCode.mockResolvedValue({
                encodedImage: 'base64==', payload: 'pix-payload', expirationDate: '2026-04-10T12:00:00Z',
            });

            const result = await useCase.execute('user-1', dto);

            expect(mockSubscriptionIntent.create).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'user-1',
                asaasCustomerId: 'cust-new',
                orgName: 'Lavacar Central',
            }));
            expect(mockCreateSubscription.create).not.toHaveBeenCalled();
            expect(result).toMatchObject({ encodedImage: 'base64==', payload: 'pix-payload' });
        });

        it('should return checkoutUrl for CREDIT_CARD billing type', async () => {
            mockFindUser.findById.mockResolvedValue(user);
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(null);
            mockAsaasService.createCustomer.mockResolvedValue({ id: 'cust-new' });
            mockAsaasService.createSubscription.mockResolvedValue({
                id: 'asaas-sub-new', status: 'PENDING', billingType: 'CREDIT_CARD', value: 99.90, nextDueDate: '2026-05-09',
            });
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });

            const ccDto = { ...dto, billingType: PaymentMethod.CREDIT_CARD };
            const result = await useCase.execute('user-1', ccDto);

            expect(mockSubscriptionIntent.create).toHaveBeenCalled();
            expect(result).toMatchObject({ checkoutUrl: 'https://asaas.com/invoice/pay-1' });
            expect(mockAsaasService.getPixQrCode).not.toHaveBeenCalled();
        });
    });

    describe('org with ACTIVE subscription', () => {
        it('should throw ConflictException', async () => {
            mockFindUser.findById.mockResolvedValue(user);
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(activeSubscription);

            await expect(useCase.execute('user-1', dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('org with PENDING subscription', () => {
        it('should resolve existing checkout without creating new subscription', async () => {
            mockFindUser.findById.mockResolvedValue(user);
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(pendingSubscription);
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });
            mockAsaasService.getPixQrCode.mockResolvedValue({
                encodedImage: 'base64==', payload: 'pix-payload', expirationDate: '2026-04-10T12:00:00Z',
            });

            await useCase.execute('user-1', dto);

            expect(mockSubscriptionIntent.create).not.toHaveBeenCalled();
            expect(mockCreateSubscription.create).not.toHaveBeenCalled();
        });
    });

    describe('org with CANCELLED subscription (reactivation)', () => {
        it('should create new Asaas subscription and local record, not intent', async () => {
            mockFindUser.findById.mockResolvedValue(user);
            mockFindOrganizationByOwner.findByOwnerId.mockResolvedValue(org);
            mockFindSubscription.findByOrganizationId.mockResolvedValue(cancelledSubscription);
            mockAsaasService.createSubscription.mockResolvedValue({
                id: 'asaas-sub-reactivated', status: 'PENDING', billingType: 'PIX',
                value: 99.90, nextDueDate: '2026-05-09', description: 'Plano NexoCar',
            });
            mockAsaasService.getSubscriptionPayments.mockResolvedValue({
                data: [{ id: 'pay-1', invoiceUrl: 'https://asaas.com/invoice/pay-1' }],
            });
            mockAsaasService.getPixQrCode.mockResolvedValue({
                encodedImage: 'base64==', payload: 'pix-payload', expirationDate: '2026-04-10T12:00:00Z',
            });

            const result = await useCase.execute('user-1', dto);

            expect(mockSubscriptionIntent.create).not.toHaveBeenCalled();
            expect(mockCreateSubscription.create).toHaveBeenCalledWith(expect.objectContaining({
                organizationId: 'org-1',
                subscriptionId: 'asaas-sub-reactivated',
            }));
            expect(result).toMatchObject({ encodedImage: 'base64==', payload: 'pix-payload' });
        });
    });
});
