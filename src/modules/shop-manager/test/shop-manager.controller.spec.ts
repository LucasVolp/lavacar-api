import { Test, TestingModule } from '@nestjs/testing';
import { ShopManagerController } from '../shop-manager.controller';
import { ShopManagerService } from '../shop-manager.service';
import { CreateShopManagerDto } from '../dto/create-shop-manager.dto';
import { UpdateShopManagerDto } from '../dto/update-shop-manager.dto';
import { SubscriptionGuard } from 'src/guards/subscription.guard';

const mockShopManagerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByShopId: jest.fn(),
    findByMemberId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

describe('ShopManagerController', () => {
    let controller: ShopManagerController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ShopManagerController],
            providers: [{ provide: ShopManagerService, useValue: mockShopManagerService }],
        })
            .overrideGuard(SubscriptionGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ShopManagerController>(ShopManagerController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // -----------------------------------------------------------
    // POST /shop-managers
    // -----------------------------------------------------------
    describe('create', () => {
        const validDto: CreateShopManagerDto = {
            memberId: '550e8400-e29b-41d4-a716-446655440001',
            shopId: '550e8400-e29b-41d4-a716-446655440002',
        };

        it('should call service.create with the DTO and return the result', async () => {
            const expected = { id: 'sm-1', ...validDto };
            mockShopManagerService.create.mockResolvedValue(expected);

            const result = await controller.create(validDto);

            expect(mockShopManagerService.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from service', async () => {
            mockShopManagerService.create.mockRejectedValue(new Error('Validation error'));

            await expect(controller.create(validDto)).rejects.toThrow('Validation error');
        });

        // SECURITY: Cross-shop manager creation
        it('should pass DTO directly without modifying memberId or shopId', async () => {
            mockShopManagerService.create.mockResolvedValue({ id: 'sm-1', ...validDto });

            await controller.create(validDto);

            const passedDto = mockShopManagerService.create.mock.calls[0][0];
            expect(passedDto).toEqual(validDto);
            expect(passedDto.memberId).toBe(validDto.memberId);
            expect(passedDto.shopId).toBe(validDto.shopId);
        });
    });

    // -----------------------------------------------------------
    // GET /shop-managers
    // -----------------------------------------------------------
    describe('findAll', () => {
        it('should call service.findAll with parsed pagination', async () => {
            const expected = { data: [], meta: { total: 0 } };
            mockShopManagerService.findAll.mockResolvedValue(expected);

            const result = await controller.findAll('1', '10');

            expect(mockShopManagerService.findAll).toHaveBeenCalledWith({
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual(expected);
        });

        it('should handle undefined pagination parameters', async () => {
            mockShopManagerService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findAll(undefined, undefined);

            expect(mockShopManagerService.findAll).toHaveBeenCalledWith({
                page: undefined,
                perPage: undefined,
            });
        });

        it('should parse string page and perPage to integers', async () => {
            mockShopManagerService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findAll('3', '25');

            expect(mockShopManagerService.findAll).toHaveBeenCalledWith({
                page: 3,
                perPage: 25,
            });
        });

        it('should handle NaN from non-numeric query strings gracefully', async () => {
            mockShopManagerService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findAll('abc', 'xyz');

            expect(mockShopManagerService.findAll).toHaveBeenCalledWith({
                page: NaN,
                perPage: NaN,
            });
        });

        it('should propagate errors from service', async () => {
            mockShopManagerService.findAll.mockRejectedValue(new Error('Service unavailable'));

            await expect(controller.findAll()).rejects.toThrow('Service unavailable');
        });
    });

    // -----------------------------------------------------------
    // GET /shop-managers/shop/:shopId
    // -----------------------------------------------------------
    describe('findByShopId', () => {
        const shopId = '550e8400-e29b-41d4-a716-446655440002';

        it('should call service.findByShopId with shopId and parsed pagination', async () => {
            const expected = { data: [{ id: 'sm-1' }], meta: { total: 1 } };
            mockShopManagerService.findByShopId.mockResolvedValue(expected);

            const result = await controller.findByShopId(shopId, '1', '10');

            expect(mockShopManagerService.findByShopId).toHaveBeenCalledWith(shopId, {
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual(expected);
        });

        it('should handle undefined pagination', async () => {
            mockShopManagerService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findByShopId(shopId);

            expect(mockShopManagerService.findByShopId).toHaveBeenCalledWith(shopId, {
                page: undefined,
                perPage: undefined,
            });
        });

        it('should propagate errors', async () => {
            mockShopManagerService.findByShopId.mockRejectedValue(new Error('fail'));

            await expect(controller.findByShopId(shopId)).rejects.toThrow('fail');
        });

        // SECURITY: Cross-shop manager access - any shopId can be queried
        it('should pass the shopId parameter directly to the service', async () => {
            const maliciousShopId = 'other-shop-uuid';
            mockShopManagerService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findByShopId(maliciousShopId);

            expect(mockShopManagerService.findByShopId.mock.calls[0][0]).toBe(maliciousShopId);
        });
    });

    // -----------------------------------------------------------
    // GET /shop-managers/member/:memberId
    // -----------------------------------------------------------
    describe('findByMemberId', () => {
        const memberId = '550e8400-e29b-41d4-a716-446655440001';

        it('should call service.findByMemberId with memberId and parsed pagination', async () => {
            const expected = { data: [{ id: 'sm-1' }], meta: { total: 1 } };
            mockShopManagerService.findByMemberId.mockResolvedValue(expected);

            const result = await controller.findByMemberId(memberId, '2', '5');

            expect(mockShopManagerService.findByMemberId).toHaveBeenCalledWith(memberId, {
                page: 2,
                perPage: 5,
            });
            expect(result).toEqual(expected);
        });

        it('should handle undefined pagination', async () => {
            mockShopManagerService.findByMemberId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findByMemberId(memberId);

            expect(mockShopManagerService.findByMemberId).toHaveBeenCalledWith(memberId, {
                page: undefined,
                perPage: undefined,
            });
        });

        it('should propagate errors', async () => {
            mockShopManagerService.findByMemberId.mockRejectedValue(new Error('fail'));

            await expect(controller.findByMemberId(memberId)).rejects.toThrow('fail');
        });
    });

    // -----------------------------------------------------------
    // GET /shop-managers/:id
    // -----------------------------------------------------------
    describe('findById', () => {
        it('should call service.findById with the id parameter', async () => {
            const expected = { id: 'sm-1', shopId: 's1', memberId: 'm1' };
            mockShopManagerService.findById.mockResolvedValue(expected);

            const result = await controller.findById('sm-1');

            expect(mockShopManagerService.findById).toHaveBeenCalledWith('sm-1');
            expect(result).toEqual(expected);
        });

        it('should propagate NotFoundException from service', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockShopManagerService.findById.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(controller.findById('nonexistent')).rejects.toThrow('Shop manager not found!');
        });
    });

    // -----------------------------------------------------------
    // PATCH /shop-managers/:id
    // -----------------------------------------------------------
    describe('update', () => {
        const updateDto: UpdateShopManagerDto = {
            memberId: '550e8400-e29b-41d4-a716-446655440003',
        };

        it('should call service.update with id and DTO', async () => {
            const updated = { id: 'sm-1', ...updateDto };
            mockShopManagerService.update.mockResolvedValue(updated);

            const result = await controller.update('sm-1', updateDto);

            expect(mockShopManagerService.update).toHaveBeenCalledWith('sm-1', updateDto);
            expect(result).toEqual(updated);
        });

        it('should propagate NotFoundException from service', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockShopManagerService.update.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(
                'Shop manager not found!',
            );
        });

        it('should handle empty update DTO', async () => {
            const emptyDto: UpdateShopManagerDto = {};
            mockShopManagerService.update.mockResolvedValue({ id: 'sm-1' });

            await controller.update('sm-1', emptyDto);

            expect(mockShopManagerService.update).toHaveBeenCalledWith('sm-1', emptyDto);
        });

        // SECURITY: Cross-shop reassignment
        it('should pass shopId update through to service without modification', async () => {
            const reassignDto: UpdateShopManagerDto = {
                shopId: '550e8400-e29b-41d4-a716-446655440099',
            };
            mockShopManagerService.update.mockResolvedValue({ id: 'sm-1', ...reassignDto });

            await controller.update('sm-1', reassignDto);

            const passedDto = mockShopManagerService.update.mock.calls[0][1];
            expect(passedDto.shopId).toBe(reassignDto.shopId);
        });
    });

    // -----------------------------------------------------------
    // DELETE /shop-managers/:id
    // -----------------------------------------------------------
    describe('delete', () => {
        it('should call service.delete with the id', async () => {
            mockShopManagerService.delete.mockResolvedValue({ id: 'sm-1' });

            const result = await controller.delete('sm-1');

            expect(mockShopManagerService.delete).toHaveBeenCalledWith('sm-1');
            expect(result).toEqual({ id: 'sm-1' });
        });

        it('should propagate NotFoundException from service', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockShopManagerService.delete.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(controller.delete('nonexistent')).rejects.toThrow('Shop manager not found!');
        });
    });

    // -----------------------------------------------------------
    // SECURITY: Manager permissions
    // -----------------------------------------------------------
    describe('Security: Manager permissions', () => {
        it('should not have any auth guard logic in controller (relies on global guards)', () => {
            // The controller does not implement any role-checking logic inline.
            // It trusts the global auth guard and decorators.
            // This test verifies the controller methods exist and delegate cleanly.
            expect(typeof controller.create).toBe('function');
            expect(typeof controller.findAll).toBe('function');
            expect(typeof controller.findByShopId).toBe('function');
            expect(typeof controller.findByMemberId).toBe('function');
            expect(typeof controller.findById).toBe('function');
            expect(typeof controller.update).toBe('function');
            expect(typeof controller.delete).toBe('function');
        });

        it('should not filter or transform data returned from service', async () => {
            const sensitiveData = {
                id: 'sm-1',
                shopId: 's1',
                memberId: 'm1',
                member: {
                    user: {
                        id: 'u1',
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@example.com',
                        picture: 'http://example.com/pic.jpg',
                    },
                },
            };
            mockShopManagerService.findById.mockResolvedValue(sensitiveData);

            const result = await controller.findById('sm-1');

            // Controller returns data as-is from service
            expect(result).toEqual(sensitiveData);
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('should handle special characters in shopId param', async () => {
            mockShopManagerService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findByShopId('shop-with-dashes-123');

            expect(mockShopManagerService.findByShopId.mock.calls[0][0]).toBe('shop-with-dashes-123');
        });

        it('should handle empty string id in findById', async () => {
            mockShopManagerService.findById.mockRejectedValue(new Error('Invalid'));

            await expect(controller.findById('')).rejects.toThrow('Invalid');
        });

        it('should handle very large page numbers', async () => {
            mockShopManagerService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            await controller.findAll('999999', '1000');

            expect(mockShopManagerService.findAll).toHaveBeenCalledWith({
                page: 999999,
                perPage: 1000,
            });
        });
    });
});
