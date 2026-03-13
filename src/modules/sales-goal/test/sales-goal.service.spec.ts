import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SalesGoalService } from '../sales-goal.service';
import { CreateSalesGoalUseCase } from '../use-cases/create-sales-goal.use-case';
import { FindAllSalesGoalUseCase } from '../use-cases/find-all-sales-goal.use-case';
import { FindSalesGoalByIdUseCase } from '../use-cases/find-sales-goal-by-id.use-case';
import { UpdateSalesGoalUseCase } from '../use-cases/update-sales-goal.use-case';
import { DeleteSalesGoalUseCase } from '../use-cases/delete-sales-goal.use-case';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindAllUseCase = { execute: jest.fn(), executeByShopId: jest.fn(), executeByOrganizationId: jest.fn() };
const mockFindByIdUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511555555555', role: 'USER' };

describe('SalesGoalService', () => {
  let service: SalesGoalService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesGoalService,
        { provide: CreateSalesGoalUseCase, useValue: mockCreateUseCase },
        { provide: FindAllSalesGoalUseCase, useValue: mockFindAllUseCase },
        { provide: FindSalesGoalByIdUseCase, useValue: mockFindByIdUseCase },
        { provide: UpdateSalesGoalUseCase, useValue: mockUpdateUseCase },
        { provide: DeleteSalesGoalUseCase, useValue: mockDeleteUseCase },
      ],
    }).compile();

    service = module.get<SalesGoalService>(SalesGoalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    const validDto = {
      amount: 5000.00,
      period: 'MONTHLY' as const,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      shopId: 'shop-uuid-1',
    };

    it('should allow ADMIN to create sales goal', async () => {
      const created = { id: 'goal-1', ...validDto };
      mockCreateUseCase.execute.mockResolvedValue(created);

      const result = await service.create(validDto as any, adminUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, adminUser);
      expect(result).toEqual(created);
    });

    it('should allow OWNER to create sales goal', async () => {
      const created = { id: 'goal-1', ...validDto };
      mockCreateUseCase.execute.mockResolvedValue(created);

      const result = await service.create(validDto as any, ownerUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, ownerUser);
      expect(result).toEqual(created);
    });

    it('should allow MANAGER to create sales goal', async () => {
      const created = { id: 'goal-1', ...validDto };
      mockCreateUseCase.execute.mockResolvedValue(created);

      const result = await service.create(validDto as any, managerUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, managerUser);
      expect(result).toEqual(created);
    });

    // --- RBAC: Service-level role check ---
    it('should throw ForbiddenException for EMPLOYEE role', async () => {
      await expect(service.create(validDto as any, employeeUser)).rejects.toThrow(ForbiddenException);
      await expect(service.create(validDto as any, employeeUser)).rejects.toThrow(
        'Only OWNER, MANAGER or ADMIN can create sales goals',
      );

      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for USER role', async () => {
      await expect(service.create(validDto as any, regularUser)).rejects.toThrow(ForbiddenException);
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for unknown roles', async () => {
      const unknownUser: JwtPayload = { id: 'x', email: '', phone: '', role: 'GUEST' };
      await expect(service.create(validDto as any, unknownUser)).rejects.toThrow(ForbiddenException);
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for empty role string', async () => {
      const noRoleUser: JwtPayload = { id: 'x', email: '', phone: '', role: '' };
      await expect(service.create(validDto as any, noRoleUser)).rejects.toThrow(ForbiddenException);
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should propagate errors from use case', async () => {
      mockCreateUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.create(validDto as any, adminUser)).rejects.toThrow('DB error');
    });

    // --- Security: RBAC case sensitivity ---
    it('should reject lowercase role strings', async () => {
      const lowercaseAdmin: JwtPayload = { id: 'x', email: '', phone: '', role: 'admin' };
      await expect(service.create(validDto as any, lowercaseAdmin)).rejects.toThrow(ForbiddenException);
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject mixed-case role strings', async () => {
      const mixedCase: JwtPayload = { id: 'x', email: '', phone: '', role: 'Admin' };
      await expect(service.create(validDto as any, mixedCase)).rejects.toThrow(ForbiddenException);
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    // --- Security: amount manipulation ---
    describe('Security - amount manipulation', () => {
      it('should forward negative amount to use case (DTO validation is responsible)', async () => {
        const dto = { ...validDto, amount: -10000 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward zero amount to use case', async () => {
        const dto = { ...validDto, amount: 0 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward extremely large amount to use case', async () => {
        const dto = { ...validDto, amount: Number.MAX_SAFE_INTEGER };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward NaN amount to use case', async () => {
        const dto = { ...validDto, amount: NaN };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward Infinity amount to use case', async () => {
        const dto = { ...validDto, amount: Infinity };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: goal period manipulation ---
    describe('Security - goal period validation', () => {
      it('should forward invalid GoalPeriod to use case (DTO validation is responsible)', async () => {
        const dto = { ...validDto, period: 'DAILY' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: date range issues ---
    describe('Security - date range manipulation', () => {
      it('should forward dates where endDate is before startDate to use case', async () => {
        const dto = { ...validDto, startDate: '2026-04-30', endDate: '2026-04-01' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward same start and end date to use case', async () => {
        const dto = { ...validDto, startDate: '2026-04-15', endDate: '2026-04-15' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward past period dates to use case', async () => {
        const dto = { ...validDto, startDate: '2020-01-01', endDate: '2020-01-31' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: XSS / injection ---
    describe('Security - injection in fields', () => {
      it('should forward XSS in shopId to use case (DTO validation is responsible)', async () => {
        const dto = { ...validDto, shopId: '<script>alert("xss")</script>' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward SQL injection in organizationId to use case', async () => {
        const dto = {
          ...validDto,
          shopId: undefined,
          organizationId: "'; DROP TABLE sales_goals; --",
        };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should delegate to FindAllSalesGoalUseCase with filters and user', async () => {
      const goals = [{ id: 'g1' }, { id: 'g2' }];
      mockFindAllUseCase.execute.mockResolvedValue(goals);

      const filters = { page: 1, perPage: 10 };
      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(goals);
    });

    it('should work with default empty filters', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([]);

      const result = await service.findAll({}, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith({}, adminUser);
      expect(result).toEqual([]);
    });

    it('should propagate errors from FindAllSalesGoalUseCase', async () => {
      mockFindAllUseCase.execute.mockRejectedValue(new Error('fail'));

      await expect(service.findAll({}, adminUser)).rejects.toThrow('fail');
    });

    it('should pass user for all roles', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([]);

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.findAll({}, user);
        expect(mockFindAllUseCase.execute).toHaveBeenCalledWith({}, user);
      }
    });
  });

  // -----------------------------------------------------------
  // findByShopId
  // -----------------------------------------------------------
  describe('findByShopId', () => {
    it('should delegate to FindAllSalesGoalUseCase.executeByShopId', async () => {
      const goals = [{ id: 'g1', shopId: 'shop-1' }];
      mockFindAllUseCase.executeByShopId.mockResolvedValue(goals);

      const result = await service.findByShopId('shop-1', { page: 1, perPage: 5 }, adminUser);

      expect(mockFindAllUseCase.executeByShopId).toHaveBeenCalledWith('shop-1', { page: 1, perPage: 5 }, adminUser);
      expect(result).toEqual(goals);
    });

    it('should work with default empty filters', async () => {
      mockFindAllUseCase.executeByShopId.mockResolvedValue([]);

      const result = await service.findByShopId('shop-1', {}, adminUser);

      expect(mockFindAllUseCase.executeByShopId).toHaveBeenCalledWith('shop-1', {}, adminUser);
      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockFindAllUseCase.executeByShopId.mockRejectedValue(new Error('fail'));

      await expect(service.findByShopId('shop-1', {}, adminUser)).rejects.toThrow('fail');
    });

    // --- Security: cross-shop access ---
    it('should pass user context so use case can enforce shop scope', async () => {
      mockFindAllUseCase.executeByShopId.mockResolvedValue([]);

      await service.findByShopId('other-shop', {}, employeeUser);

      const [, , passedUser] = mockFindAllUseCase.executeByShopId.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
      expect(passedUser.role).toBe('EMPLOYEE');
    });
  });

  // -----------------------------------------------------------
  // findByOrganizationId
  // -----------------------------------------------------------
  describe('findByOrganizationId', () => {
    it('should delegate to FindAllSalesGoalUseCase.executeByOrganizationId', async () => {
      const goals = [{ id: 'g1', organizationId: 'org-1' }];
      mockFindAllUseCase.executeByOrganizationId.mockResolvedValue(goals);

      const result = await service.findByOrganizationId('org-1', { page: 1, perPage: 5 }, adminUser);

      expect(mockFindAllUseCase.executeByOrganizationId).toHaveBeenCalledWith(
        'org-1',
        { page: 1, perPage: 5 },
        adminUser,
      );
      expect(result).toEqual(goals);
    });

    it('should work with default empty filters', async () => {
      mockFindAllUseCase.executeByOrganizationId.mockResolvedValue([]);

      const result = await service.findByOrganizationId('org-1', {}, adminUser);

      expect(mockFindAllUseCase.executeByOrganizationId).toHaveBeenCalledWith('org-1', {}, adminUser);
      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockFindAllUseCase.executeByOrganizationId.mockRejectedValue(new Error('fail'));

      await expect(service.findByOrganizationId('org-1', {}, adminUser)).rejects.toThrow('fail');
    });

    it('should pass user context for scope enforcement', async () => {
      mockFindAllUseCase.executeByOrganizationId.mockResolvedValue([]);

      await service.findByOrganizationId('org-1', {}, employeeUser);

      const [, , passedUser] = mockFindAllUseCase.executeByOrganizationId.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindSalesGoalByIdUseCase with id and user', async () => {
      const goal = { id: 'g1', amount: 5000, period: 'MONTHLY' };
      mockFindByIdUseCase.execute.mockResolvedValue(goal);

      const result = await service.findOne('g1', adminUser);

      expect(mockFindByIdUseCase.execute).toHaveBeenCalledWith('g1', adminUser);
      expect(result).toEqual(goal);
    });

    it('should propagate errors when goal not found', async () => {
      mockFindByIdUseCase.execute.mockRejectedValue(new Error('Sales goal not found'));

      await expect(service.findOne('missing', adminUser)).rejects.toThrow('Sales goal not found');
    });

    it('should pass user context for all roles', async () => {
      mockFindByIdUseCase.execute.mockResolvedValue({ id: 'g1' });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.findOne('g1', user);
        expect(mockFindByIdUseCase.execute).toHaveBeenCalledWith('g1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { amount: 7500 };

    it('should delegate to UpdateSalesGoalUseCase with id, data and user', async () => {
      const updated = { id: 'g1', amount: 7500 };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('g1', updateDto as any, adminUser);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate errors from use case', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(new Error('Sales goal not found'));

      await expect(service.update('missing', updateDto as any, adminUser)).rejects.toThrow('Sales goal not found');
    });

    it('should pass user context for scope enforcement', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

      await service.update('g1', updateDto as any, employeeUser);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', updateDto, employeeUser);
    });

    // --- Security: amount manipulation on update ---
    describe('Security - amount manipulation on update', () => {
      it('should forward negative amount update to use case', async () => {
        const dto = { amount: -5000 };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1', amount: -5000 });

        await service.update('g1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', dto, adminUser);
      });

      it('should forward NaN amount update to use case', async () => {
        const dto = { amount: NaN };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.update('g1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', dto, adminUser);
      });

      it('should forward unreasonably large goal target to use case', async () => {
        const dto = { amount: 999999999999.99 };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.update('g1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', dto, adminUser);
      });
    });

    // --- Security: date range manipulation on update ---
    describe('Security - date manipulation on update', () => {
      it('should forward reversed dates to use case', async () => {
        const dto = { startDate: '2026-12-31', endDate: '2026-01-01' };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.update('g1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', dto, adminUser);
      });

      it('should forward invalid date strings to use case', async () => {
        const dto = { startDate: 'not-a-date', endDate: 'also-not-a-date' };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

        await service.update('g1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('g1', dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteSalesGoalUseCase with id and user', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('g1', adminUser);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('g1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate errors when goal not found', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(new Error('Sales goal not found'));

      await expect(service.remove('missing', adminUser)).rejects.toThrow('Sales goal not found');
    });

    it('should pass user context for all roles', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.remove('g1', user);
        expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('g1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // Security: RBAC at service level
  // -----------------------------------------------------------
  describe('Security - RBAC enforcement in service', () => {
    const validDto = {
      amount: 5000,
      period: 'MONTHLY',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      shopId: 'shop-1',
    };

    it('should enforce role check before calling use case on create', async () => {
      await expect(service.create(validDto as any, employeeUser)).rejects.toThrow(ForbiddenException);

      // Verify use case was NEVER called
      expect(mockCreateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should not enforce role check on findAll (all roles can read)', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([]);

      // EMPLOYEE should be able to read
      await service.findAll({}, employeeUser);
      expect(mockFindAllUseCase.execute).toHaveBeenCalled();
    });

    it('should not enforce role check on findOne (all roles can read)', async () => {
      mockFindByIdUseCase.execute.mockResolvedValue({ id: 'g1' });

      await service.findOne('g1', employeeUser);
      expect(mockFindByIdUseCase.execute).toHaveBeenCalled();
    });

    it('should not enforce service-level role check on update (delegated to use case)', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({ id: 'g1' });

      await service.update('g1', { amount: 100 } as any, employeeUser);
      expect(mockUpdateUseCase.execute).toHaveBeenCalled();
    });

    it('should not enforce service-level role check on remove (delegated to use case)', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      await service.remove('g1', employeeUser);
      expect(mockDeleteUseCase.execute).toHaveBeenCalled();
    });

    // -- Role injection attempts --
    it('should reject role with extra whitespace', async () => {
      const spacedRole: JwtPayload = { id: 'x', email: '', phone: '', role: ' ADMIN ' };
      await expect(service.create(validDto as any, spacedRole)).rejects.toThrow(ForbiddenException);
    });

    it('should reject role with null-byte injection', async () => {
      const nullByteRole: JwtPayload = { id: 'x', email: '', phone: '', role: 'ADMIN\0' };
      await expect(service.create(validDto as any, nullByteRole)).rejects.toThrow(ForbiddenException);
    });
  });

  // -----------------------------------------------------------
  // Security: shop scope isolation
  // -----------------------------------------------------------
  describe('Security - shop scope isolation', () => {
    it('should pass user to findByShopId so scope can be enforced', async () => {
      mockFindAllUseCase.executeByShopId.mockResolvedValue([]);

      await service.findByShopId('shop-other-owner', {}, employeeUser);

      const [shopId, , passedUser] = mockFindAllUseCase.executeByShopId.mock.calls[0];
      expect(shopId).toBe('shop-other-owner');
      expect(passedUser.id).toBe('employee-1');
    });

    it('should pass user to findByOrganizationId so scope can be enforced', async () => {
      mockFindAllUseCase.executeByOrganizationId.mockResolvedValue([]);

      await service.findByOrganizationId('org-other-owner', {}, employeeUser);

      const [orgId, , passedUser] = mockFindAllUseCase.executeByOrganizationId.mock.calls[0];
      expect(orgId).toBe('org-other-owner');
      expect(passedUser.id).toBe('employee-1');
    });
  });
});
