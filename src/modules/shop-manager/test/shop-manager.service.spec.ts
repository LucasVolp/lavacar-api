import { Test, TestingModule } from '@nestjs/testing';
import { ShopManagerService } from '../shop-manager.service';
import {
    CreateShopManagerUseCase,
    FindAllShopManagerUseCase,
    FindShopManagerByIdUseCase,
    UpdateShopManagerUseCase,
    DeleteShopManagerUseCase,
} from '../use-cases';
import { CreateShopManagerDto } from '../dto/create-shop-manager.dto';
import { UpdateShopManagerDto } from '../dto/update-shop-manager.dto';

const mockCreateShopManagerUseCase = { execute: jest.fn() };
const mockFindAllShopManagerUseCase = {
    execute: jest.fn(),
    executeByShopId: jest.fn(),
    executeByMemberId: jest.fn(),
};
const mockFindShopManagerByIdUseCase = { execute: jest.fn() };
const mockUpdateShopManagerUseCase = { execute: jest.fn() };
const mockDeleteShopManagerUseCase = { execute: jest.fn() };

describe('ShopManagerService', () => {
    let service: ShopManagerService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShopManagerService,
                { provide: CreateShopManagerUseCase, useValue: mockCreateShopManagerUseCase },
                { provide: FindAllShopManagerUseCase, useValue: mockFindAllShopManagerUseCase },
                { provide: FindShopManagerByIdUseCase, useValue: mockFindShopManagerByIdUseCase },
                { provide: UpdateShopManagerUseCase, useValue: mockUpdateShopManagerUseCase },
                { provide: DeleteShopManagerUseCase, useValue: mockDeleteShopManagerUseCase },
            ],
        }).compile();

        service = module.get<ShopManagerService>(ShopManagerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // -----------------------------------------------------------
    // create
    // -----------------------------------------------------------
    describe('create', () => {
        const validDto: CreateShopManagerDto = {
            memberId: '550e8400-e29b-41d4-a716-446655440001',
            shopId: '550e8400-e29b-41d4-a716-446655440002',
        };

        it('should delegate to CreateShopManagerUseCase with correct data', async () => {
            const expected = { id: 'sm-1', ...validDto };
            mockCreateShopManagerUseCase.execute.mockResolvedValue(expected);

            const result = await service.create(validDto);

            expect(mockCreateShopManagerUseCase.execute).toHaveBeenCalledWith(validDto);
            expect(mockCreateShopManagerUseCase.execute).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expected);
        });

        it('should propagate NotFoundException when member does not exist', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new NotFoundException('Organization member not found'),
            );

            await expect(service.create(validDto)).rejects.toThrow('Organization member not found');
        });

        it('should propagate NotFoundException when shop does not exist', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new NotFoundException('Shop not found'),
            );

            await expect(service.create(validDto)).rejects.toThrow('Shop not found');
        });

        it('should propagate BadRequestException for cross-organization assignment', async () => {
            const { BadRequestException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new BadRequestException('Shop does not belong to the same organization as the member'),
            );

            await expect(service.create(validDto)).rejects.toThrow(
                'Shop does not belong to the same organization as the member',
            );
        });

        it('should propagate BadRequestException when duplicate shop-member relation exists', async () => {
            const { BadRequestException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new BadRequestException('This member is already a manager of this shop'),
            );

            await expect(service.create(validDto)).rejects.toThrow(
                'This member is already a manager of this shop',
            );
        });

        it('should propagate ServiceUnavailableException on unexpected errors', async () => {
            const { ServiceUnavailableException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Error creating shop manager'),
            );

            await expect(service.create(validDto)).rejects.toThrow('Error creating shop manager');
        });

        // SECURITY: Cross-shop manager access - ensure UUIDs are passed as-is
        it('should pass memberId and shopId exactly as provided without modification', async () => {
            mockCreateShopManagerUseCase.execute.mockResolvedValue({ id: 'sm-1', ...validDto });

            await service.create(validDto);

            const passedDto = mockCreateShopManagerUseCase.execute.mock.calls[0][0];
            expect(passedDto.memberId).toBe(validDto.memberId);
            expect(passedDto.shopId).toBe(validDto.shopId);
        });
    });

    // -----------------------------------------------------------
    // findAll
    // -----------------------------------------------------------
    describe('findAll', () => {
        const paginatedResult = {
            data: [{ id: 'sm-1' }, { id: 'sm-2' }],
            meta: { total: 2, page: 1, perPage: 10 },
        };

        it('should delegate to FindAllShopManagerUseCase with filters', async () => {
            mockFindAllShopManagerUseCase.execute.mockResolvedValue(paginatedResult);

            const filters = { page: 1, perPage: 10 };
            const result = await service.findAll(filters);

            expect(mockFindAllShopManagerUseCase.execute).toHaveBeenCalledWith(filters);
            expect(result).toEqual(paginatedResult);
        });

        it('should work without filters (undefined)', async () => {
            mockFindAllShopManagerUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            const result = await service.findAll();

            expect(mockFindAllShopManagerUseCase.execute).toHaveBeenCalledWith(undefined);
            expect(result.data).toEqual([]);
        });

        it('should forward pagination parameters correctly', async () => {
            mockFindAllShopManagerUseCase.execute.mockResolvedValue(paginatedResult);

            await service.findAll({ page: 3, perPage: 25 });

            expect(mockFindAllShopManagerUseCase.execute).toHaveBeenCalledWith({ page: 3, perPage: 25 });
        });

        it('should propagate errors from FindAllShopManagerUseCase', async () => {
            mockFindAllShopManagerUseCase.execute.mockRejectedValue(new Error('DB connection error'));

            await expect(service.findAll()).rejects.toThrow('DB connection error');
        });
    });

    // -----------------------------------------------------------
    // findByShopId
    // -----------------------------------------------------------
    describe('findByShopId', () => {
        const shopId = '550e8400-e29b-41d4-a716-446655440002';

        it('should delegate to FindAllShopManagerUseCase.executeByShopId', async () => {
            const expected = { data: [{ id: 'sm-1' }], meta: { total: 1 } };
            mockFindAllShopManagerUseCase.executeByShopId.mockResolvedValue(expected);

            const result = await service.findByShopId(shopId, { page: 1, perPage: 10 });

            expect(mockFindAllShopManagerUseCase.executeByShopId).toHaveBeenCalledWith(shopId, {
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual(expected);
        });

        it('should work without pagination filters', async () => {
            mockFindAllShopManagerUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findByShopId(shopId);

            expect(mockFindAllShopManagerUseCase.executeByShopId).toHaveBeenCalledWith(shopId, undefined);
        });

        it('should propagate errors', async () => {
            mockFindAllShopManagerUseCase.executeByShopId.mockRejectedValue(new Error('fail'));

            await expect(service.findByShopId(shopId)).rejects.toThrow('fail');
        });

        // SECURITY: Cross-shop manager access - shopId is passed directly
        it('should pass shopId exactly as provided to the use case', async () => {
            mockFindAllShopManagerUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findByShopId(shopId);

            expect(mockFindAllShopManagerUseCase.executeByShopId.mock.calls[0][0]).toBe(shopId);
        });
    });

    // -----------------------------------------------------------
    // findByMemberId
    // -----------------------------------------------------------
    describe('findByMemberId', () => {
        const memberId = '550e8400-e29b-41d4-a716-446655440001';

        it('should delegate to FindAllShopManagerUseCase.executeByMemberId', async () => {
            const expected = { data: [{ id: 'sm-1' }], meta: { total: 1 } };
            mockFindAllShopManagerUseCase.executeByMemberId.mockResolvedValue(expected);

            const result = await service.findByMemberId(memberId, { page: 1, perPage: 10 });

            expect(mockFindAllShopManagerUseCase.executeByMemberId).toHaveBeenCalledWith(memberId, {
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual(expected);
        });

        it('should work without pagination filters', async () => {
            mockFindAllShopManagerUseCase.executeByMemberId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findByMemberId(memberId);

            expect(mockFindAllShopManagerUseCase.executeByMemberId).toHaveBeenCalledWith(memberId, undefined);
        });

        it('should propagate errors', async () => {
            mockFindAllShopManagerUseCase.executeByMemberId.mockRejectedValue(new Error('fail'));

            await expect(service.findByMemberId(memberId)).rejects.toThrow('fail');
        });
    });

    // -----------------------------------------------------------
    // findById
    // -----------------------------------------------------------
    describe('findById', () => {
        it('should delegate to FindShopManagerByIdUseCase', async () => {
            const shopManager = { id: 'sm-1', shopId: 's1', memberId: 'm1' };
            mockFindShopManagerByIdUseCase.execute.mockResolvedValue(shopManager);

            const result = await service.findById('sm-1');

            expect(mockFindShopManagerByIdUseCase.execute).toHaveBeenCalledWith('sm-1');
            expect(result).toEqual(shopManager);
        });

        it('should propagate NotFoundException when shop manager not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindShopManagerByIdUseCase.execute.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(service.findById('nonexistent')).rejects.toThrow('Shop manager not found!');
        });

        it('should propagate ServiceUnavailableException on unexpected errors', async () => {
            const { ServiceUnavailableException } = await import('@nestjs/common');
            mockFindShopManagerByIdUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Error finding shop manager'),
            );

            await expect(service.findById('sm-1')).rejects.toThrow('Error finding shop manager');
        });
    });

    // -----------------------------------------------------------
    // update
    // -----------------------------------------------------------
    describe('update', () => {
        const updateDto: UpdateShopManagerDto = {
            memberId: '550e8400-e29b-41d4-a716-446655440003',
        };

        it('should delegate to UpdateShopManagerUseCase with id and data', async () => {
            const updated = { id: 'sm-1', ...updateDto, shopId: 's1' };
            mockUpdateShopManagerUseCase.execute.mockResolvedValue(updated);

            const result = await service.update('sm-1', updateDto);

            expect(mockUpdateShopManagerUseCase.execute).toHaveBeenCalledWith('sm-1', updateDto);
            expect(result).toEqual(updated);
        });

        it('should propagate NotFoundException when shop manager not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockUpdateShopManagerUseCase.execute.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(service.update('nonexistent', updateDto)).rejects.toThrow('Shop manager not found!');
        });

        it('should propagate NotFoundException when new member does not exist', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockUpdateShopManagerUseCase.execute.mockRejectedValue(
                new NotFoundException('Organization member not found'),
            );

            await expect(service.update('sm-1', updateDto)).rejects.toThrow('Organization member not found');
        });

        it('should propagate BadRequestException for duplicate shop-member combination', async () => {
            const { BadRequestException } = await import('@nestjs/common');
            mockUpdateShopManagerUseCase.execute.mockRejectedValue(
                new BadRequestException('This member is already a manager of this shop'),
            );

            await expect(service.update('sm-1', updateDto)).rejects.toThrow(
                'This member is already a manager of this shop',
            );
        });

        it('should handle partial update with only shopId', async () => {
            const partialDto: UpdateShopManagerDto = {
                shopId: '550e8400-e29b-41d4-a716-446655440004',
            };
            mockUpdateShopManagerUseCase.execute.mockResolvedValue({ id: 'sm-1', ...partialDto });

            await service.update('sm-1', partialDto);

            expect(mockUpdateShopManagerUseCase.execute).toHaveBeenCalledWith('sm-1', partialDto);
        });

        it('should handle update with both fields', async () => {
            const fullDto: UpdateShopManagerDto = {
                memberId: '550e8400-e29b-41d4-a716-446655440003',
                shopId: '550e8400-e29b-41d4-a716-446655440004',
            };
            mockUpdateShopManagerUseCase.execute.mockResolvedValue({ id: 'sm-1', ...fullDto });

            await service.update('sm-1', fullDto);

            expect(mockUpdateShopManagerUseCase.execute).toHaveBeenCalledWith('sm-1', fullDto);
        });

        it('should handle empty update DTO', async () => {
            const emptyDto: UpdateShopManagerDto = {};
            mockUpdateShopManagerUseCase.execute.mockResolvedValue({ id: 'sm-1', shopId: 's1', memberId: 'm1' });

            await service.update('sm-1', emptyDto);

            expect(mockUpdateShopManagerUseCase.execute).toHaveBeenCalledWith('sm-1', emptyDto);
        });
    });

    // -----------------------------------------------------------
    // delete
    // -----------------------------------------------------------
    describe('delete', () => {
        it('should delegate to DeleteShopManagerUseCase', async () => {
            const deleted = { id: 'sm-1', shopId: 's1', memberId: 'm1' };
            mockDeleteShopManagerUseCase.execute.mockResolvedValue(deleted);

            const result = await service.delete('sm-1');

            expect(mockDeleteShopManagerUseCase.execute).toHaveBeenCalledWith('sm-1');
            expect(result).toEqual(deleted);
        });

        it('should propagate NotFoundException when shop manager not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockDeleteShopManagerUseCase.execute.mockRejectedValue(
                new NotFoundException('Shop manager not found!'),
            );

            await expect(service.delete('nonexistent')).rejects.toThrow('Shop manager not found!');
        });

        it('should propagate ServiceUnavailableException on unexpected errors', async () => {
            const { ServiceUnavailableException } = await import('@nestjs/common');
            mockDeleteShopManagerUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Error deleting shop manager'),
            );

            await expect(service.delete('sm-1')).rejects.toThrow('Error deleting shop manager');
        });
    });

    // -----------------------------------------------------------
    // SECURITY: Manager permissions - cross-shop access
    // -----------------------------------------------------------
    describe('Security: Cross-shop manager access', () => {
        it('should not modify shopId when querying by shop (no implicit filtering)', async () => {
            const shopIdA = '550e8400-e29b-41d4-a716-446655440010';
            const shopIdB = '550e8400-e29b-41d4-a716-446655440020';

            mockFindAllShopManagerUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findByShopId(shopIdA);
            await service.findByShopId(shopIdB);

            expect(mockFindAllShopManagerUseCase.executeByShopId).toHaveBeenCalledTimes(2);
            expect(mockFindAllShopManagerUseCase.executeByShopId.mock.calls[0][0]).toBe(shopIdA);
            expect(mockFindAllShopManagerUseCase.executeByShopId.mock.calls[1][0]).toBe(shopIdB);
        });

        it('should not modify memberId when querying by member', async () => {
            const memberIdA = '550e8400-e29b-41d4-a716-446655440030';
            const memberIdB = '550e8400-e29b-41d4-a716-446655440040';

            mockFindAllShopManagerUseCase.executeByMemberId.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findByMemberId(memberIdA);
            await service.findByMemberId(memberIdB);

            expect(mockFindAllShopManagerUseCase.executeByMemberId).toHaveBeenCalledTimes(2);
            expect(mockFindAllShopManagerUseCase.executeByMemberId.mock.calls[0][0]).toBe(memberIdA);
            expect(mockFindAllShopManagerUseCase.executeByMemberId.mock.calls[1][0]).toBe(memberIdB);
        });

        it('create should reject when shop organization does not match member organization', async () => {
            const { BadRequestException } = await import('@nestjs/common');
            mockCreateShopManagerUseCase.execute.mockRejectedValue(
                new BadRequestException('Shop does not belong to the same organization as the member'),
            );

            const crossOrgDto: CreateShopManagerDto = {
                memberId: '550e8400-e29b-41d4-a716-446655440001',
                shopId: '550e8400-e29b-41d4-a716-446655440099',
            };

            await expect(service.create(crossOrgDto)).rejects.toThrow(
                'Shop does not belong to the same organization as the member',
            );
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('should handle empty string IDs passed through to use cases', async () => {
            mockFindShopManagerByIdUseCase.execute.mockRejectedValue(new Error('Invalid ID'));

            await expect(service.findById('')).rejects.toThrow('Invalid ID');
        });

        it('findAll should handle zero page value', async () => {
            mockFindAllShopManagerUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findAll({ page: 0, perPage: 10 });

            expect(mockFindAllShopManagerUseCase.execute).toHaveBeenCalledWith({ page: 0, perPage: 10 });
        });

        it('findAll should handle negative perPage value (validation is external)', async () => {
            mockFindAllShopManagerUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findAll({ page: 1, perPage: -5 });

            expect(mockFindAllShopManagerUseCase.execute).toHaveBeenCalledWith({ page: 1, perPage: -5 });
        });
    });
});
