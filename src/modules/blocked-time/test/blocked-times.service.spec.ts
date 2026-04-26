import { Test, TestingModule } from '@nestjs/testing';
import { BlockedTimesService } from '../blocked-times.service';
import {
    CreateBlockedTimeUseCase,
    FindAllBlockedTimeUseCase,
    FindBlockedTimeByIdUseCase,
    UpdateBlockedTimeUseCase,
    DeleteBlockedTimeUseCase,
} from '../use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { BlockedTimeType } from '../types/BlockedTimeType';

// ── Mocks ──────────────────────────────────────────────────────────
const mockCreateBlockedTimeUseCase = { execute: jest.fn() };
const mockFindAllBlockedTimeUseCase = { execute: jest.fn() };
const mockFindBlockedTimeByIdUseCase = { execute: jest.fn() };
const mockUpdateBlockedTimeUseCase = { execute: jest.fn() };
const mockDeleteBlockedTimeUseCase = { execute: jest.fn() };

// ── Test fixtures ──────────────────────────────────────────────────
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999990000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511999990001', role: 'OWNER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511999990004', role: 'EMPLOYEE' };
const managerUser: JwtPayload = { id: 'mgr-1', email: 'mgr@test.com', phone: '+5511999990005', role: 'MANAGER' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511999990002', role: 'USER' };
const otherOwner: JwtPayload = { id: 'owner-2', email: 'other-owner@test.com', phone: '+5511999990006', role: 'OWNER' };

const mockBlockedTime = {
    id: 'bt-1',
    type: BlockedTimeType.FULL_DAY,
    date: new Date('2026-04-01T00:00:00.000Z'),
    reason: 'Holiday',
    shopId: 'shop-1',
    startTime: null,
    endTime: null,
};

const mockPartialBlockedTime = {
    id: 'bt-2',
    type: BlockedTimeType.PARTIAL,
    date: new Date('2026-04-02T00:00:00.000Z'),
    reason: 'Maintenance',
    shopId: 'shop-1',
    startTime: '08:00',
    endTime: '12:00',
};

const mockCreateFullDayDto = {
    type: BlockedTimeType.FULL_DAY,
    date: '2026-04-01',
    reason: 'Holiday',
    shopId: 'shop-1',
};

const mockCreatePartialDto = {
    type: BlockedTimeType.PARTIAL,
    date: '2026-04-02',
    reason: 'Maintenance',
    shopId: 'shop-1',
    startTime: '08:00',
    endTime: '12:00',
};

describe('BlockedTimesService', () => {
    let service: BlockedTimesService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlockedTimesService,
                { provide: CreateBlockedTimeUseCase, useValue: mockCreateBlockedTimeUseCase },
                { provide: FindAllBlockedTimeUseCase, useValue: mockFindAllBlockedTimeUseCase },
                { provide: FindBlockedTimeByIdUseCase, useValue: mockFindBlockedTimeByIdUseCase },
                { provide: UpdateBlockedTimeUseCase, useValue: mockUpdateBlockedTimeUseCase },
                { provide: DeleteBlockedTimeUseCase, useValue: mockDeleteBlockedTimeUseCase },
            ],
        }).compile();

        service = module.get<BlockedTimesService>(BlockedTimesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // -----------------------------------------------------------
    // create
    // -----------------------------------------------------------
    describe('create', () => {
        it('should delegate to CreateBlockedTimeUseCase with data and user', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            const result = await service.create(mockCreateFullDayDto as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(mockCreateFullDayDto, ownerUser);
            expect(result).toEqual(mockBlockedTime);
        });

        it('should pass PARTIAL blocked time DTO with startTime and endTime', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockPartialBlockedTime);

            const result = await service.create(mockCreatePartialDto as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(mockCreatePartialDto, ownerUser);
            expect(result).toEqual(mockPartialBlockedTime);
        });

        it('should pass ADMIN user context for shop scope resolution', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(mockCreateFullDayDto as any, adminUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(mockCreateFullDayDto, adminUser);
        });

        it('should pass EMPLOYEE user context', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(mockCreateFullDayDto as any, employeeUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(mockCreateFullDayDto, employeeUser);
        });

        it('should pass MANAGER user context', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(mockCreateFullDayDto as any, managerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(mockCreateFullDayDto, managerUser);
        });

        it('should propagate errors from CreateBlockedTimeUseCase', async () => {
            mockCreateBlockedTimeUseCase.execute.mockRejectedValue(new Error('Conflict'));

            await expect(service.create(mockCreateFullDayDto as any, ownerUser)).rejects.toThrow('Conflict');
        });
    });

    // -----------------------------------------------------------
    // findAll
    // -----------------------------------------------------------
    describe('findAll', () => {
        const mockPaginatedResult = {
            data: [mockBlockedTime],
            meta: { total: 1, page: 1, perPage: 10 },
        };

        it('should delegate to FindAllBlockedTimeUseCase with filters and user', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = { shopId: 'shop-1', page: 1, perPage: 10 };

            const result = await service.findAll(filters, ownerUser);

            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith(filters, ownerUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should pass empty filters when none provided', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue(mockPaginatedResult);

            const result = await service.findAll({}, ownerUser);

            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith({}, ownerUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should pass default empty object when filters is undefined', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue(mockPaginatedResult);

            const result = await service.findAll(undefined, ownerUser);

            // The service has a default parameter = {}, so undefined becomes {}
            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith({}, ownerUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should support pagination filters', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = { page: 2, perPage: 20 };

            await service.findAll(filters, ownerUser);

            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith(filters, ownerUser);
        });

        it('should propagate errors from FindAllBlockedTimeUseCase', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockRejectedValue(new Error('DB error'));

            await expect(service.findAll({}, ownerUser)).rejects.toThrow('DB error');
        });
    });

    // -----------------------------------------------------------
    // findOne
    // -----------------------------------------------------------
    describe('findOne', () => {
        it('should delegate to FindBlockedTimeByIdUseCase with id and user', async () => {
            mockFindBlockedTimeByIdUseCase.execute.mockResolvedValue(mockBlockedTime);

            const result = await service.findOne('bt-1', ownerUser);

            expect(mockFindBlockedTimeByIdUseCase.execute).toHaveBeenCalledWith('bt-1', ownerUser);
            expect(result).toEqual(mockBlockedTime);
        });

        it('should propagate NotFoundException from use case', async () => {
            mockFindBlockedTimeByIdUseCase.execute.mockRejectedValue(new Error('Blocked time not found!'));

            await expect(service.findOne('nonexistent', ownerUser)).rejects.toThrow('Blocked time not found!');
        });

        it('should pass admin user context for authorization', async () => {
            mockFindBlockedTimeByIdUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.findOne('bt-1', adminUser);

            expect(mockFindBlockedTimeByIdUseCase.execute).toHaveBeenCalledWith('bt-1', adminUser);
        });
    });

    // -----------------------------------------------------------
    // update
    // -----------------------------------------------------------
    describe('update', () => {
        it('should delegate to UpdateBlockedTimeUseCase with id, data, and user', async () => {
            const updateDto = { reason: 'Updated reason' };
            const updated = { ...mockBlockedTime, reason: 'Updated reason' };
            mockUpdateBlockedTimeUseCase.execute.mockResolvedValue(updated);

            const result = await service.update('bt-1', updateDto as any, ownerUser);

            expect(mockUpdateBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
            expect(result).toEqual(updated);
        });

        it('should forward type change from FULL_DAY to PARTIAL', async () => {
            const updateDto = {
                type: BlockedTimeType.PARTIAL,
                startTime: '09:00',
                endTime: '13:00',
            };
            mockUpdateBlockedTimeUseCase.execute.mockResolvedValue(mockPartialBlockedTime);

            await service.update('bt-1', updateDto as any, ownerUser);

            expect(mockUpdateBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
        });

        it('should forward date update', async () => {
            const updateDto = { date: '2026-05-01' };
            mockUpdateBlockedTimeUseCase.execute.mockResolvedValue({ ...mockBlockedTime, date: new Date('2026-05-01') });

            await service.update('bt-1', updateDto as any, ownerUser);

            expect(mockUpdateBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
        });

        it('should propagate errors from UpdateBlockedTimeUseCase', async () => {
            mockUpdateBlockedTimeUseCase.execute.mockRejectedValue(new Error('Not found'));

            await expect(
                service.update('nonexistent', { reason: 'test' } as any, ownerUser),
            ).rejects.toThrow('Not found');
        });
    });

    // -----------------------------------------------------------
    // remove
    // -----------------------------------------------------------
    describe('remove', () => {
        it('should delegate to DeleteBlockedTimeUseCase with id and user', async () => {
            mockDeleteBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            const result = await service.remove('bt-1', ownerUser);

            expect(mockDeleteBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', ownerUser);
            expect(result).toEqual(mockBlockedTime);
        });

        it('should propagate NotFoundException from use case', async () => {
            mockDeleteBlockedTimeUseCase.execute.mockRejectedValue(new Error('Blocked time not found!'));

            await expect(service.remove('nonexistent', ownerUser)).rejects.toThrow('Blocked time not found!');
        });

        it('should pass admin user context', async () => {
            mockDeleteBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.remove('bt-1', adminUser);

            expect(mockDeleteBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', adminUser);
        });
    });

    // -----------------------------------------------------------
    // Security: IDOR (Insecure Direct Object Reference)
    // -----------------------------------------------------------
    describe('Security: IDOR', () => {
        it('should pass user context to findOne for shop-scoped access control', async () => {
            mockFindBlockedTimeByIdUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.findOne('bt-1', otherOwner);

            // The user context is passed so the repository can enforce that
            // the user has access to the shop this blocked time belongs to
            expect(mockFindBlockedTimeByIdUseCase.execute).toHaveBeenCalledWith('bt-1', otherOwner);
        });

        it('should pass user context to findAll for shop-scoped filtering', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            // Even if shopId filter points to shop-1, user context ensures proper scoping
            await service.findAll({ shopId: 'shop-1' }, otherOwner);

            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith(
                { shopId: 'shop-1' },
                otherOwner,
            );
        });

        it('should pass user context to update for ownership verification', async () => {
            mockUpdateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.update('bt-1', { reason: 'hacked' } as any, otherOwner);

            expect(mockUpdateBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', { reason: 'hacked' }, otherOwner);
        });

        it('should pass user context to remove for ownership verification', async () => {
            mockDeleteBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.remove('bt-1', otherOwner);

            expect(mockDeleteBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', otherOwner);
        });
    });

    // -----------------------------------------------------------
    // Security: Authorization - shopId scoping
    // -----------------------------------------------------------
    describe('Security: Shop scoping on create', () => {
        it('should pass user context to create for buildShopScope verification', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            const dtoWithDifferentShop = { ...mockCreateFullDayDto, shopId: 'shop-other' };
            await service.create(dtoWithDifferentShop as any, ownerUser);

            // The use case will call buildShopScope to verify the user has access to shop-other
            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(
                dtoWithDifferentShop,
                ownerUser,
            );
        });

        it('should pass all different roles for shop scope verification', async () => {
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            for (const user of [adminUser, ownerUser, employeeUser, managerUser]) {
                await service.create(mockCreateFullDayDto as any, user);

                expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(
                    mockCreateFullDayDto,
                    user,
                );
            }

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledTimes(4);
        });
    });

    // -----------------------------------------------------------
    // Security: Input validation passthrough
    // -----------------------------------------------------------
    describe('Security: Input passthrough', () => {
        it('should pass reason with XSS payload to use case (stored XSS risk if not sanitized)', async () => {
            const dtoWithXss = {
                ...mockCreateFullDayDto,
                reason: '<script>alert("xss")</script>',
            };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(dtoWithXss as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(dtoWithXss, ownerUser);
        });

        it('should pass SQL injection in reason to use case (parameterized queries should protect)', async () => {
            const dtoWithSql = {
                ...mockCreateFullDayDto,
                reason: "'; DROP TABLE blocked_times; --",
            };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(dtoWithSql as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(dtoWithSql, ownerUser);
        });

        it('should pass invalid time formats to use case (DTO validation should catch)', async () => {
            const dtoWithBadTimes = {
                type: BlockedTimeType.PARTIAL,
                date: '2026-04-02',
                shopId: 'shop-1',
                startTime: '99:99',
                endTime: '00:00',
            };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockPartialBlockedTime);

            await service.create(dtoWithBadTimes as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(dtoWithBadTimes, ownerUser);
        });

        it('should pass invalid date format to use case (DTO validation should catch)', async () => {
            const dtoWithBadDate = {
                ...mockCreateFullDayDto,
                date: 'not-a-date',
            };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(dtoWithBadDate as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(dtoWithBadDate, ownerUser);
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('should handle empty shopId in filters', async () => {
            mockFindAllBlockedTimeUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findAll({ shopId: '' }, ownerUser);

            expect(mockFindAllBlockedTimeUseCase.execute).toHaveBeenCalledWith({ shopId: '' }, ownerUser);
        });

        it('should handle update with empty data object', async () => {
            mockUpdateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.update('bt-1', {} as any, ownerUser);

            expect(mockUpdateBlockedTimeUseCase.execute).toHaveBeenCalledWith('bt-1', {}, ownerUser);
        });

        it('should handle create with optional fields omitted', async () => {
            const minimalDto = {
                type: BlockedTimeType.FULL_DAY,
                date: '2026-04-01',
                shopId: 'shop-1',
            };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(minimalDto as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(minimalDto, ownerUser);
        });

        it('should handle very long reason strings', async () => {
            const longReason = 'A'.repeat(10000);
            const dtoWithLongReason = { ...mockCreateFullDayDto, reason: longReason };
            mockCreateBlockedTimeUseCase.execute.mockResolvedValue(mockBlockedTime);

            await service.create(dtoWithLongReason as any, ownerUser);

            expect(mockCreateBlockedTimeUseCase.execute).toHaveBeenCalledWith(dtoWithLongReason, ownerUser);
        });
    });
});
