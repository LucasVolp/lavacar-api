import { Test, TestingModule } from '@nestjs/testing';
import { BlockedTimesController } from '../blocked-times.controller';
import { BlockedTimesService } from '../blocked-times.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { BlockedTimeType } from '../types/BlockedTimeType';

// ── Mocks ──────────────────────────────────────────────────────────
const mockBlockedTimesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

// ── Test fixtures ──────────────────────────────────────────────────
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999990000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511999990001', role: 'OWNER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511999990004', role: 'EMPLOYEE' };
const managerUser: JwtPayload = { id: 'mgr-1', email: 'mgr@test.com', phone: '+5511999990005', role: 'MANAGER' };
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

const mockUpdateDto = {
    reason: 'Updated reason',
};

describe('BlockedTimesController', () => {
    let controller: BlockedTimesController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlockedTimesController],
            providers: [
                { provide: BlockedTimesService, useValue: mockBlockedTimesService },
            ],
        }).compile();

        controller = module.get<BlockedTimesController>(BlockedTimesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // -----------------------------------------------------------
    // POST /blockedtime
    // -----------------------------------------------------------
    describe('create', () => {
        it('should delegate to blockedTimesService.create with data and user', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, ownerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreateFullDayDto, ownerUser);
        });

        it('should pass PARTIAL blocked time DTO', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockPartialBlockedTime);

            controller.create(mockCreatePartialDto as any, ownerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreatePartialDto, ownerUser);
        });

        it('should pass ADMIN user context', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, adminUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreateFullDayDto, adminUser);
        });

        it('should pass EMPLOYEE user context', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, employeeUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreateFullDayDto, employeeUser);
        });

        it('should pass MANAGER user context', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, managerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreateFullDayDto, managerUser);
        });

        it('should propagate errors from blockedTimesService.create', async () => {
            mockBlockedTimesService.create.mockRejectedValue(new Error('Conflict'));

            await expect(controller.create(mockCreateFullDayDto as any, ownerUser)).rejects.toThrow('Conflict');
        });
    });

    // -----------------------------------------------------------
    // GET /blockedtime
    // -----------------------------------------------------------
    describe('findAll', () => {
        const mockPaginatedResult = {
            data: [mockBlockedTime, mockPartialBlockedTime],
            meta: { total: 2, page: 1, perPage: 10 },
        };

        it('should pass parsed query params to blockedTimesService.findAll', () => {
            mockBlockedTimesService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(ownerUser, 'shop-1', '1', '10');

            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(
                {
                    shopId: 'shop-1',
                    page: 1,
                    perPage: 10,
                },
                ownerUser,
            );
        });

        it('should handle undefined query params', () => {
            mockBlockedTimesService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(ownerUser);

            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(
                {
                    shopId: undefined,
                    page: undefined,
                    perPage: undefined,
                },
                ownerUser,
            );
        });

        it('should parse page and perPage as integers', () => {
            mockBlockedTimesService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(ownerUser, 'shop-1', '3', '25');

            const callArgs = mockBlockedTimesService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBe(3);
            expect(callArgs.perPage).toBe(25);
        });

        it('should propagate errors from blockedTimesService.findAll', async () => {
            mockBlockedTimesService.findAll.mockRejectedValue(new Error('DB error'));

            await expect(controller.findAll(ownerUser, 'shop-1')).rejects.toThrow('DB error');
        });
    });

    // -----------------------------------------------------------
    // GET /blockedtime/:id
    // -----------------------------------------------------------
    describe('findOne', () => {
        it('should delegate to blockedTimesService.findOne with id and user', () => {
            mockBlockedTimesService.findOne.mockResolvedValue(mockBlockedTime);

            controller.findOne('bt-1', ownerUser);

            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith('bt-1', ownerUser);
        });

        it('should propagate errors when blocked time not found', async () => {
            mockBlockedTimesService.findOne.mockRejectedValue(new Error('Blocked time not found!'));

            await expect(controller.findOne('nonexistent', ownerUser)).rejects.toThrow('Blocked time not found!');
        });
    });

    // -----------------------------------------------------------
    // PATCH /blockedtime/:id
    // -----------------------------------------------------------
    describe('update', () => {
        it('should delegate to blockedTimesService.update with id, data, and user', () => {
            const updated = { ...mockBlockedTime, reason: 'Updated reason' };
            mockBlockedTimesService.update.mockResolvedValue(updated);

            controller.update('bt-1', mockUpdateDto as any, ownerUser);

            expect(mockBlockedTimesService.update).toHaveBeenCalledWith('bt-1', mockUpdateDto, ownerUser);
        });

        it('should forward type change', () => {
            const updateDto = {
                type: BlockedTimeType.PARTIAL,
                startTime: '09:00',
                endTime: '13:00',
            };
            mockBlockedTimesService.update.mockResolvedValue(mockPartialBlockedTime);

            controller.update('bt-1', updateDto as any, ownerUser);

            expect(mockBlockedTimesService.update).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
        });

        it('should propagate errors from blockedTimesService.update', async () => {
            mockBlockedTimesService.update.mockRejectedValue(new Error('Not found'));

            await expect(
                controller.update('nonexistent', mockUpdateDto as any, ownerUser),
            ).rejects.toThrow('Not found');
        });
    });

    // -----------------------------------------------------------
    // DELETE /blockedtime/:id
    // -----------------------------------------------------------
    describe('remove', () => {
        it('should delegate to blockedTimesService.remove with id and user', () => {
            mockBlockedTimesService.remove.mockResolvedValue(mockBlockedTime);

            controller.remove('bt-1', ownerUser);

            expect(mockBlockedTimesService.remove).toHaveBeenCalledWith('bt-1', ownerUser);
        });

        it('should propagate errors from blockedTimesService.remove', async () => {
            mockBlockedTimesService.remove.mockRejectedValue(new Error('Blocked time not found!'));

            await expect(controller.remove('nonexistent', ownerUser)).rejects.toThrow('Blocked time not found!');
        });
    });

    // -----------------------------------------------------------
    // Security: IDOR (Insecure Direct Object Reference)
    // -----------------------------------------------------------
    describe('Security: IDOR', () => {
        it('should pass user context to findOne - prevents accessing other shops blocked times', () => {
            mockBlockedTimesService.findOne.mockResolvedValue(mockBlockedTime);

            controller.findOne('bt-1', otherOwner);

            // User context is passed so the service/use-case can verify shop access
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith('bt-1', otherOwner);
        });

        it('should pass user context to update - prevents modifying other shops blocked times', () => {
            mockBlockedTimesService.update.mockResolvedValue(mockBlockedTime);

            controller.update('bt-1', { reason: 'hacked' } as any, otherOwner);

            expect(mockBlockedTimesService.update).toHaveBeenCalledWith('bt-1', { reason: 'hacked' }, otherOwner);
        });

        it('should pass user context to remove - prevents deleting other shops blocked times', () => {
            mockBlockedTimesService.remove.mockResolvedValue(mockBlockedTime);

            controller.remove('bt-1', otherOwner);

            expect(mockBlockedTimesService.remove).toHaveBeenCalledWith('bt-1', otherOwner);
        });

        it('should pass user context to findAll - prevents listing other shops blocked times', () => {
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(otherOwner, 'shop-1');

            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ shopId: 'shop-1' }),
                otherOwner,
            );
        });

        it('should pass user context to create - prevents creating blocked times for other shops', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, otherOwner);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(mockCreateFullDayDto, otherOwner);
        });
    });

    // -----------------------------------------------------------
    // Security: Authorization - role-based access
    // -----------------------------------------------------------
    describe('Security: Role-based access', () => {
        it('should forward ADMIN role in user context for all operations', async () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            mockBlockedTimesService.findOne.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.update.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.remove.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, adminUser);
            controller.findAll(adminUser, 'shop-1');
            controller.findOne('bt-1', adminUser);
            controller.update('bt-1', mockUpdateDto as any, adminUser);
            controller.remove('bt-1', adminUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(expect.anything(), adminUser);
            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(expect.anything(), adminUser);
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith(expect.anything(), adminUser);
            expect(mockBlockedTimesService.update).toHaveBeenCalledWith(expect.anything(), expect.anything(), adminUser);
            expect(mockBlockedTimesService.remove).toHaveBeenCalledWith(expect.anything(), adminUser);
        });

        it('should forward OWNER role in user context for all operations', async () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            mockBlockedTimesService.findOne.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.update.mockResolvedValue(mockBlockedTime);
            mockBlockedTimesService.remove.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, ownerUser);
            controller.findAll(ownerUser, 'shop-1');
            controller.findOne('bt-1', ownerUser);
            controller.update('bt-1', mockUpdateDto as any, ownerUser);
            controller.remove('bt-1', ownerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(expect.anything(), ownerUser);
            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(expect.anything(), ownerUser);
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith(expect.anything(), ownerUser);
            expect(mockBlockedTimesService.update).toHaveBeenCalledWith(expect.anything(), expect.anything(), ownerUser);
            expect(mockBlockedTimesService.remove).toHaveBeenCalledWith(expect.anything(), ownerUser);
        });

        it('should forward EMPLOYEE role in user context', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, employeeUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(expect.anything(), employeeUser);
        });

        it('should forward MANAGER role in user context', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            controller.create(mockCreateFullDayDto as any, managerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(expect.anything(), managerUser);
        });
    });

    // -----------------------------------------------------------
    // Security: Input validation / injection
    // -----------------------------------------------------------
    describe('Security: Input validation', () => {
        it('should pass XSS payload in reason to service (DTO/sanitization should protect)', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            const dtoWithXss = {
                ...mockCreateFullDayDto,
                reason: '<img src=x onerror=alert(1)>',
            };
            controller.create(dtoWithXss as any, ownerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(dtoWithXss, ownerUser);
        });

        it('should pass SQL injection in id param to service (Prisma handles)', () => {
            mockBlockedTimesService.findOne.mockResolvedValue(null);

            controller.findOne("1' OR '1'='1", ownerUser);

            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith("1' OR '1'='1", ownerUser);
        });

        it('should pass special characters in shopId query param', () => {
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(ownerUser, '../../../etc/passwd');

            expect(mockBlockedTimesService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ shopId: '../../../etc/passwd' }),
                ownerUser,
            );
        });

        it('should pass unicode in reason', () => {
            mockBlockedTimesService.update.mockResolvedValue(mockBlockedTime);

            const updateDto = { reason: '\u0000\u0001\uFFFF\uD800' };
            controller.update('bt-1', updateDto as any, ownerUser);

            expect(mockBlockedTimesService.update).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('findAll should handle NaN page gracefully (parseInt returns NaN)', () => {
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(ownerUser, 'shop-1', 'abc', 'xyz');

            const callArgs = mockBlockedTimesService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBeNaN();
            expect(callArgs.perPage).toBeNaN();
        });

        it('findAll should pass undefined when page and perPage are not provided', () => {
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(ownerUser, 'shop-1');

            const callArgs = mockBlockedTimesService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBeUndefined();
            expect(callArgs.perPage).toBeUndefined();
        });

        it('create should forward entire DTO without modification', () => {
            mockBlockedTimesService.create.mockResolvedValue(mockBlockedTime);

            const fullDto = {
                type: BlockedTimeType.PARTIAL,
                date: '2026-04-02',
                reason: 'Detailed maintenance - replacing equipment',
                shopId: 'shop-uuid-123',
                startTime: '14:00',
                endTime: '18:30',
            };

            controller.create(fullDto as any, ownerUser);

            expect(mockBlockedTimesService.create).toHaveBeenCalledWith(fullDto, ownerUser);
        });

        it('update should forward entire update DTO without modification', () => {
            mockBlockedTimesService.update.mockResolvedValue(mockPartialBlockedTime);

            const updateDto = {
                type: BlockedTimeType.PARTIAL,
                date: '2026-05-15',
                reason: 'New reason',
                startTime: '10:00',
                endTime: '14:00',
            };

            controller.update('bt-1', updateDto as any, ownerUser);

            expect(mockBlockedTimesService.update).toHaveBeenCalledWith('bt-1', updateDto, ownerUser);
        });

        it('should pass zero-value page correctly', () => {
            mockBlockedTimesService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(ownerUser, 'shop-1', '0', '0');

            const callArgs = mockBlockedTimesService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBe(0);
            expect(callArgs.perPage).toBe(0);
        });

        it('should handle concurrent requests independently', async () => {
            mockBlockedTimesService.findOne.mockResolvedValue(mockBlockedTime);

            const results = await Promise.all([
                controller.findOne('bt-1', ownerUser),
                controller.findOne('bt-2', adminUser),
                controller.findOne('bt-3', employeeUser),
            ]);

            expect(mockBlockedTimesService.findOne).toHaveBeenCalledTimes(3);
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith('bt-1', ownerUser);
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith('bt-2', adminUser);
            expect(mockBlockedTimesService.findOne).toHaveBeenCalledWith('bt-3', employeeUser);
        });
    });
});
