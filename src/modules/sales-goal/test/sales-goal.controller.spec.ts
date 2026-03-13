import { Test, TestingModule } from '@nestjs/testing';
import { SalesGoalController } from '../sales-goal.controller';
import { SalesGoalService } from '../sales-goal.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { ForbiddenException, NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';

const mockSalesGoalService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByShopId: jest.fn(),
  findByOrganizationId: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };

describe('SalesGoalController', () => {
  let controller: SalesGoalController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesGoalController],
      providers: [
        { provide: SalesGoalService, useValue: mockSalesGoalService },
      ],
    }).compile();

    controller = module.get<SalesGoalController>(SalesGoalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /sales-goal
  // -----------------------------------------------------------
  describe('create', () => {
    const validDto = {
      amount: 5000.00,
      period: 'MONTHLY' as const,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      shopId: 'shop-uuid-1',
    };

    it('should delegate to service.create with dto and user', async () => {
      const created = { id: 'goal-1', ...validDto };
      mockSalesGoalService.create.mockResolvedValue(created);

      const result = await controller.create(validDto as any, adminUser);

      expect(mockSalesGoalService.create).toHaveBeenCalledWith(validDto, adminUser);
      expect(result).toEqual(created);
    });

    it('should propagate ForbiddenException from service (RBAC)', async () => {
      mockSalesGoalService.create.mockRejectedValue(
        new ForbiddenException('Only OWNER, MANAGER or ADMIN can create sales goals'),
      );

      await expect(controller.create(validDto as any, employeeUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate BadRequestException from service', async () => {
      mockSalesGoalService.create.mockRejectedValue(
        new BadRequestException('Either shopId or organizationId must be provided'),
      );

      await expect(controller.create({} as any, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('should propagate NotFoundException from service', async () => {
      mockSalesGoalService.create.mockRejectedValue(new NotFoundException('Shop not found'));

      await expect(controller.create(validDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException from service', async () => {
      mockSalesGoalService.create.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.create(validDto as any, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass through all authorized roles', async () => {
      mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await controller.create(validDto as any, user);
        expect(mockSalesGoalService.create).toHaveBeenCalledWith(validDto, user);
      }
    });

    // --- Security: amount manipulation ---
    describe('Security - amount manipulation', () => {
      it('should forward negative amount to service (DTO pipe validation is responsible)', async () => {
        const dto = { ...validDto, amount: -50000 };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward NaN amount to service', async () => {
        const dto = { ...validDto, amount: NaN };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward Infinity amount to service', async () => {
        const dto = { ...validDto, amount: Infinity };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward MAX_SAFE_INTEGER amount to service', async () => {
        const dto = { ...validDto, amount: Number.MAX_SAFE_INTEGER };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: GoalPeriod validation ---
    describe('Security - GoalPeriod validation', () => {
      it('should forward invalid GoalPeriod to service (DTO validation is responsible)', async () => {
        const dto = { ...validDto, period: 'YEARLY' };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward numeric period value to service', async () => {
        const dto = { ...validDto, period: 999 };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: date range issues ---
    describe('Security - date range manipulation', () => {
      it('should forward reversed dates to service (use case validates)', async () => {
        const dto = { ...validDto, startDate: '2026-12-31', endDate: '2026-01-01' };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward past-period dates to service', async () => {
        const dto = { ...validDto, startDate: '2020-01-01', endDate: '2020-01-31' };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward same start and end date to service', async () => {
        const dto = { ...validDto, startDate: '2026-04-15', endDate: '2026-04-15' };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: XSS / injection ---
    describe('Security - injection in text fields', () => {
      it('should forward XSS in shopId to service (DTO validation is responsible)', async () => {
        const dto = { ...validDto, shopId: '<img src=x onerror=alert(1)>' };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward SQL injection in organizationId to service', async () => {
        const dto = {
          ...validDto,
          shopId: undefined,
          organizationId: "1' OR '1'='1",
        };
        mockSalesGoalService.create.mockResolvedValue({ id: 'g1' });

        await controller.create(dto as any, adminUser);

        expect(mockSalesGoalService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // GET /sales-goal
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should pass parsed query params to service.findAll', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, '1', '10');

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: 1, perPage: 10 },
        adminUser,
      );
    });

    it('should handle undefined query params', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined);

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should parse page as integer', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, '3', '25');

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: 3, perPage: 25 },
        adminUser,
      );
    });

    it('should return the list of goals from service', async () => {
      const goals = [{ id: 'g1' }, { id: 'g2' }];
      mockSalesGoalService.findAll.mockResolvedValue(goals);

      const result = await controller.findAll(adminUser, undefined, undefined);

      expect(result).toEqual(goals);
    });

    it('should propagate errors from service', async () => {
      mockSalesGoalService.findAll.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.findAll(adminUser, undefined, undefined)).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Edge case: non-numeric page/perPage ---
    it('should result in NaN for non-numeric page string', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, 'abc', 'xyz');

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: NaN, perPage: NaN },
        adminUser,
      );
    });
  });

  // -----------------------------------------------------------
  // GET /sales-goal/shop/:shopId
  // -----------------------------------------------------------
  describe('findByShopId', () => {
    it('should delegate to service.findByShopId with shopId, parsed filters and user', async () => {
      const goals = [{ id: 'g1' }];
      mockSalesGoalService.findByShopId.mockResolvedValue(goals);

      const result = await controller.findByShopId(adminUser, 'shop-1', '1', '10');

      expect(mockSalesGoalService.findByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: 1, perPage: 10 },
        adminUser,
      );
      expect(result).toEqual(goals);
    });

    it('should handle undefined query params', async () => {
      mockSalesGoalService.findByShopId.mockResolvedValue([]);

      await controller.findByShopId(adminUser, 'shop-1', undefined, undefined);

      expect(mockSalesGoalService.findByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should propagate errors from service', async () => {
      mockSalesGoalService.findByShopId.mockRejectedValue(new Error('fail'));

      await expect(controller.findByShopId(adminUser, 'shop-1', undefined, undefined)).rejects.toThrow('fail');
    });

    // --- Security: cross-shop access ---
    it('should pass user context so service can enforce shop scope', async () => {
      mockSalesGoalService.findByShopId.mockResolvedValue([]);

      await controller.findByShopId(employeeUser, 'other-shop-id', undefined, undefined);

      const [, , passedUser] = mockSalesGoalService.findByShopId.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
      expect(passedUser.role).toBe('EMPLOYEE');
    });
  });

  // -----------------------------------------------------------
  // GET /sales-goal/organization/:organizationId
  // -----------------------------------------------------------
  describe('findByOrganizationId', () => {
    it('should delegate to service.findByOrganizationId with orgId, parsed filters and user', async () => {
      const goals = [{ id: 'g1' }];
      mockSalesGoalService.findByOrganizationId.mockResolvedValue(goals);

      const result = await controller.findByOrganizationId(adminUser, 'org-1', '1', '10');

      expect(mockSalesGoalService.findByOrganizationId).toHaveBeenCalledWith(
        'org-1',
        { page: 1, perPage: 10 },
        adminUser,
      );
      expect(result).toEqual(goals);
    });

    it('should handle undefined query params', async () => {
      mockSalesGoalService.findByOrganizationId.mockResolvedValue([]);

      await controller.findByOrganizationId(adminUser, 'org-1', undefined, undefined);

      expect(mockSalesGoalService.findByOrganizationId).toHaveBeenCalledWith(
        'org-1',
        { page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should propagate errors from service', async () => {
      mockSalesGoalService.findByOrganizationId.mockRejectedValue(new Error('fail'));

      await expect(
        controller.findByOrganizationId(adminUser, 'org-1', undefined, undefined),
      ).rejects.toThrow('fail');
    });

    it('should pass user context for scope enforcement', async () => {
      mockSalesGoalService.findByOrganizationId.mockResolvedValue([]);

      await controller.findByOrganizationId(employeeUser, 'org-other', undefined, undefined);

      const [, , passedUser] = mockSalesGoalService.findByOrganizationId.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });
  });

  // -----------------------------------------------------------
  // GET /sales-goal/:id
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to service.findOne with id and user', async () => {
      const goal = { id: 'g1', amount: 5000, period: 'MONTHLY' };
      mockSalesGoalService.findOne.mockResolvedValue(goal);

      const result = await controller.findOne('g1', adminUser);

      expect(mockSalesGoalService.findOne).toHaveBeenCalledWith('g1', adminUser);
      expect(result).toEqual(goal);
    });

    it('should propagate NotFoundException', async () => {
      mockSalesGoalService.findOne.mockRejectedValue(
        new NotFoundException('Sales goal not found'),
      );

      await expect(controller.findOne('missing', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException', async () => {
      mockSalesGoalService.findOne.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.findOne('g1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for all roles', async () => {
      mockSalesGoalService.findOne.mockResolvedValue({ id: 'g1' });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await controller.findOne('g1', user);
        expect(mockSalesGoalService.findOne).toHaveBeenCalledWith('g1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // PATCH /sales-goal/:id
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { amount: 7500 };

    it('should delegate to service.update with id, dto and user', async () => {
      const updated = { id: 'g1', amount: 7500 };
      mockSalesGoalService.update.mockResolvedValue(updated);

      const result = await controller.update('g1', updateDto as any, adminUser);

      expect(mockSalesGoalService.update).toHaveBeenCalledWith('g1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when goal not found', async () => {
      mockSalesGoalService.update.mockRejectedValue(
        new NotFoundException('Sales goal not found'),
      );

      await expect(controller.update('missing', updateDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for date validation', async () => {
      mockSalesGoalService.update.mockRejectedValue(
        new BadRequestException('End date must be after start date'),
      );

      await expect(
        controller.update('g1', { startDate: '2026-12-31', endDate: '2026-01-01' } as any, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    // --- Security: amount manipulation on update ---
    it('should forward negative amount update to service', async () => {
      const dto = { amount: -999 };
      mockSalesGoalService.update.mockResolvedValue({ id: 'g1', amount: -999 });

      await controller.update('g1', dto as any, adminUser);

      expect(mockSalesGoalService.update).toHaveBeenCalledWith('g1', dto, adminUser);
    });

    it('should forward zero amount update to service', async () => {
      const dto = { amount: 0 };
      mockSalesGoalService.update.mockResolvedValue({ id: 'g1', amount: 0 });

      await controller.update('g1', dto as any, adminUser);

      expect(mockSalesGoalService.update).toHaveBeenCalledWith('g1', dto, adminUser);
    });

    // --- Security: date manipulation on update ---
    it('should forward reversed date range to service', async () => {
      const dto = { startDate: '2027-12-31', endDate: '2027-01-01' };
      mockSalesGoalService.update.mockResolvedValue({ id: 'g1' });

      await controller.update('g1', dto as any, adminUser);

      expect(mockSalesGoalService.update).toHaveBeenCalledWith('g1', dto, adminUser);
    });
  });

  // -----------------------------------------------------------
  // DELETE /sales-goal/:id
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to service.remove with id and user', async () => {
      mockSalesGoalService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('g1', adminUser);

      expect(mockSalesGoalService.remove).toHaveBeenCalledWith('g1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate NotFoundException', async () => {
      mockSalesGoalService.remove.mockRejectedValue(
        new NotFoundException('Sales goal not found'),
      );

      await expect(controller.remove('missing', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException', async () => {
      mockSalesGoalService.remove.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.remove('g1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for all roles', async () => {
      mockSalesGoalService.remove.mockResolvedValue({ deleted: true });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await controller.remove('g1', user);
        expect(mockSalesGoalService.remove).toHaveBeenCalledWith('g1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // RBAC: @Roles decorator tests
  // -----------------------------------------------------------
  describe('RBAC - Roles decorator', () => {
    it('should have Roles decorator on the controller class', () => {
      const roles = Reflect.getMetadata('roles', SalesGoalController);
      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('OWNER');
      expect(roles).toContain('EMPLOYEE');
      expect(roles).toContain('MANAGER');
    });

    it('should NOT include USER role in controller decorator', () => {
      const roles = Reflect.getMetadata('roles', SalesGoalController);
      expect(roles).not.toContain('USER');
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('create should forward entire DTO unchanged to service', async () => {
      const fullDto = {
        amount: 10000.50,
        period: 'WEEKLY',
        startDate: '2026-05-01',
        endDate: '2026-05-07',
        shopId: 'shop-uuid-123',
      };
      mockSalesGoalService.create.mockResolvedValue({ id: 'g1', ...fullDto });

      await controller.create(fullDto as any, adminUser);

      expect(mockSalesGoalService.create).toHaveBeenCalledWith(fullDto, adminUser);
    });

    it('findAll should handle only page without perPage', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, '2', undefined);

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: 2, perPage: undefined },
        adminUser,
      );
    });

    it('findAll should handle only perPage without page', async () => {
      mockSalesGoalService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, '50');

      expect(mockSalesGoalService.findAll).toHaveBeenCalledWith(
        { page: undefined, perPage: 50 },
        adminUser,
      );
    });

    it('update with empty dto should still delegate to service', async () => {
      mockSalesGoalService.update.mockResolvedValue({ id: 'g1' });

      await controller.update('g1', {} as any, adminUser);

      expect(mockSalesGoalService.update).toHaveBeenCalledWith('g1', {}, adminUser);
    });

    it('findByShopId should parse page and perPage as integers', async () => {
      mockSalesGoalService.findByShopId.mockResolvedValue([]);

      await controller.findByShopId(adminUser, 'shop-1', '5', '20');

      expect(mockSalesGoalService.findByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: 5, perPage: 20 },
        adminUser,
      );
    });

    it('findByOrganizationId should parse page and perPage as integers', async () => {
      mockSalesGoalService.findByOrganizationId.mockResolvedValue([]);

      await controller.findByOrganizationId(adminUser, 'org-1', '2', '15');

      expect(mockSalesGoalService.findByOrganizationId).toHaveBeenCalledWith(
        'org-1',
        { page: 2, perPage: 15 },
        adminUser,
      );
    });
  });
});
