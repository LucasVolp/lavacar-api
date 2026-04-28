import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from '../billing.controller';
import { BillingService } from '../billing.service';
import { AsaasService } from '../services/asaas.service';

const mockBillingService = {
    createCheckout: jest.fn(),
    createSelfCheckout: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateSubscription: jest.fn(),
    handleWebhook: jest.fn(),
    getBillingStatus: jest.fn(),
};

describe('BillingController', () => {
    let controller: BillingController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BillingController],
            providers: [
                { provide: BillingService, useValue: mockBillingService },
                { provide: AsaasService, useValue: {} },
            ],
        }).compile();

        controller = module.get<BillingController>(BillingController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getBillingStatus should delegate to service', () => {
        const mockStatus = { userRole: 'USER', canAccessOrganization: false, hasOrganization: false };
        mockBillingService.getBillingStatus.mockReturnValue(mockStatus);

        const result = controller.getBillingStatus({ id: 'user-1', role: 'USER' } as any);

        expect(mockBillingService.getBillingStatus).toHaveBeenCalledWith('user-1', 'USER');
        expect(result).toEqual(mockStatus);
    });

    it('findAll should pass undefined for invalid page/limit strings', () => {
        mockBillingService.findAll.mockReturnValue({ data: [], total: 0 });

        controller.findAll(undefined, 'abc', '-5');

        expect(mockBillingService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('findAll should pass valid page and limit as numbers', () => {
        mockBillingService.findAll.mockReturnValue({ data: [], total: 0 });

        controller.findAll('org-1', '2', '10');

        expect(mockBillingService.findAll).toHaveBeenCalledWith('org-1', 2, 10);
    });
});
