import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationMemberController } from '../organization-member.controller';
import { OrganizationMemberService } from '../organization-member.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

const mockOrganizationMemberService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByOrganizationId: jest.fn(),
  findByShopId: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('OrganizationMemberController', () => {
  let controller: OrganizationMemberController;

  const makeUser = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
    id: 'user-1',
    email: 'user@test.com',
    phone: '+5511999999999',
    role: 'OWNER',
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationMemberController],
      providers: [
        { provide: OrganizationMemberService, useValue: mockOrganizationMemberService },
      ],
    }).compile();

    controller = module.get<OrganizationMemberController>(OrganizationMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /organization-members
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      userId: 'user-uuid-1',
      organizationId: 'org-uuid-1',
      role: 'EMPLOYEE' as any,
    };

    it('should delegate to organizationMemberService.create', async () => {
      const member = { id: 'member-1', ...createDto };
      mockOrganizationMemberService.create.mockResolvedValue(member);

      const result = await controller.create(createDto as any);

      expect(mockOrganizationMemberService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(member);
    });

    it('should forward the entire DTO to service', async () => {
      const fullDto = { userId: 'u1', organizationId: 'o1', role: 'MANAGER' as any };
      mockOrganizationMemberService.create.mockResolvedValue({ id: 'member-1' });

      await controller.create(fullDto as any);

      expect(mockOrganizationMemberService.create).toHaveBeenCalledWith(fullDto);
    });

    it('should propagate NotFoundException for missing user', async () => {
      mockOrganizationMemberService.create.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.create(createDto as any)).rejects.toThrow(NotFoundException);
    });

    it('should propagate NotFoundException for missing organization', async () => {
      mockOrganizationMemberService.create.mockRejectedValue(
        new NotFoundException('Organization not found'),
      );

      await expect(controller.create(createDto as any)).rejects.toThrow('Organization not found');
    });

    it('should propagate BadRequestException for duplicate membership', async () => {
      mockOrganizationMemberService.create.mockRejectedValue(
        new BadRequestException('User is already a member of this organization'),
      );

      await expect(controller.create(createDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should propagate generic errors from service', async () => {
      mockOrganizationMemberService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createDto as any)).rejects.toThrow('Creation failed');
    });
  });

  // -----------------------------------------------------------
  // GET /organization-members
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should parse page and perPage query params as integers', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('2', '15');

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({
        page: 2,
        perPage: 15,
      });
    });

    it('should pass undefined for missing query params', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(undefined, undefined);

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({
        page: undefined,
        perPage: undefined,
      });
    });

    it('should handle partial query params', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('3', undefined);

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({
        page: 3,
        perPage: undefined,
      });
    });

    it('should handle NaN from non-numeric strings', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('abc', 'xyz');

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({
        page: NaN,
        perPage: NaN,
      });
    });

    it('should return paginated results', async () => {
      const result = {
        data: [{ id: 'member-1' }, { id: 'member-2' }],
        meta: { total: 2, page: 1, perPage: 10 },
      };
      mockOrganizationMemberService.findAll.mockResolvedValue(result);

      const response = await controller.findAll('1', '10');

      expect(response).toEqual(result);
    });

    it('should propagate errors from service', async () => {
      mockOrganizationMemberService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll('1', '10')).rejects.toThrow('DB error');
    });
  });

  // -----------------------------------------------------------
  // GET /organization-members/organization/:organizationId
  // -----------------------------------------------------------
  describe('findByOrganizationId', () => {
    it('should delegate to service with organizationId and pagination', async () => {
      const result = {
        data: [{ id: 'member-1', organizationId: 'org-1' }],
        meta: { total: 1, page: 1, perPage: 10 },
      };
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue(result);

      const response = await controller.findByOrganizationId('org-1', '1', '10');

      expect(mockOrganizationMemberService.findByOrganizationId).toHaveBeenCalledWith('org-1', {
        page: 1,
        perPage: 10,
      });
      expect(response).toEqual(result);
    });

    it('should pass undefined for missing pagination params', async () => {
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      await controller.findByOrganizationId('org-1', undefined, undefined);

      expect(mockOrganizationMemberService.findByOrganizationId).toHaveBeenCalledWith('org-1', {
        page: undefined,
        perPage: undefined,
      });
    });

    it('should propagate errors from service', async () => {
      mockOrganizationMemberService.findByOrganizationId.mockRejectedValue(new Error('fail'));

      await expect(controller.findByOrganizationId('org-1', '1', '10')).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // GET /organization-members/shop/:shopId
  // -----------------------------------------------------------
  describe('findByShopId', () => {
    it('should delegate to service with shopId', async () => {
      const members = [{ id: 'member-1', userId: 'user-1' }];
      mockOrganizationMemberService.findByShopId.mockResolvedValue(members);

      const result = await controller.findByShopId('shop-1');

      expect(mockOrganizationMemberService.findByShopId).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual(members);
    });

    it('should return empty array when no members found', async () => {
      mockOrganizationMemberService.findByShopId.mockResolvedValue([]);

      const result = await controller.findByShopId('empty-shop');

      expect(result).toEqual([]);
    });

    it('should propagate errors from service', async () => {
      mockOrganizationMemberService.findByShopId.mockRejectedValue(new Error('fail'));

      await expect(controller.findByShopId('shop-1')).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // GET /organization-members/:id
  // -----------------------------------------------------------
  describe('findById', () => {
    it('should delegate to service with member id', async () => {
      const member = { id: 'member-1', userId: 'user-1', organizationId: 'org-1' };
      mockOrganizationMemberService.findById.mockResolvedValue(member);

      const result = await controller.findById('member-1');

      expect(mockOrganizationMemberService.findById).toHaveBeenCalledWith('member-1');
      expect(result).toEqual(member);
    });

    it('should propagate NotFoundException', async () => {
      mockOrganizationMemberService.findById.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(controller.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // PATCH /organization-members/:id
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to service with id, data, and user', async () => {
      const updateDto = { role: 'MANAGER' as any };
      const user = makeUser({ id: 'admin-1', role: 'OWNER' });
      const updated = { id: 'member-1', role: 'MANAGER' };
      mockOrganizationMemberService.update.mockResolvedValue(updated);

      const result = await controller.update('member-1', updateDto as any, user);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith('member-1', updateDto, user);
      expect(result).toEqual(updated);
    });

    it('should pass the complete JwtPayload user object to service', async () => {
      const user = makeUser({ id: 'user-123', email: 'admin@test.com', role: 'ADMIN' });
      mockOrganizationMemberService.update.mockResolvedValue({});

      await controller.update('member-1', { isActive: true } as any, user);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith(
        'member-1',
        { isActive: true },
        user,
      );
    });

    it('should propagate NotFoundException when member not found', async () => {
      const user = makeUser();
      mockOrganizationMemberService.update.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(controller.update('missing', {} as any, user)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when editing own permissions', async () => {
      const user = makeUser({ id: 'self-user' });
      mockOrganizationMemberService.update.mockRejectedValue(
        new ForbiddenException('You cannot edit your own permissions'),
      );

      await expect(
        controller.update('member-self', { role: 'ADMIN' as any } as any, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should propagate generic errors from service', async () => {
      const user = makeUser();
      mockOrganizationMemberService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('member-1', {} as any, user)).rejects.toThrow('Update failed');
    });
  });

  // -----------------------------------------------------------
  // DELETE /organization-members/:id
  // -----------------------------------------------------------
  describe('delete', () => {
    it('should delegate to service with id and user', async () => {
      const user = makeUser({ id: 'admin-1', role: 'OWNER' });
      mockOrganizationMemberService.delete.mockResolvedValue({ id: 'member-1' });

      const result = await controller.delete('member-1', user);

      expect(mockOrganizationMemberService.delete).toHaveBeenCalledWith('member-1', user);
      expect(result).toEqual({ id: 'member-1' });
    });

    it('should pass the complete JwtPayload user object to service', async () => {
      const user = makeUser({ id: 'deleter-1', role: 'ADMIN' });
      mockOrganizationMemberService.delete.mockResolvedValue({});

      await controller.delete('member-1', user);

      expect(mockOrganizationMemberService.delete).toHaveBeenCalledWith('member-1', user);
    });

    it('should propagate NotFoundException', async () => {
      const user = makeUser();
      mockOrganizationMemberService.delete.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(controller.delete('missing', user)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when deleting self', async () => {
      const user = makeUser({ id: 'self-user' });
      mockOrganizationMemberService.delete.mockRejectedValue(
        new ForbiddenException('You cannot remove yourself from the organization'),
      );

      await expect(controller.delete('member-self', user)).rejects.toThrow(ForbiddenException);
      await expect(controller.delete('member-self', user)).rejects.toThrow(
        'You cannot remove yourself from the organization',
      );
    });

    it('should propagate generic errors from service', async () => {
      const user = makeUser();
      mockOrganizationMemberService.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.delete('member-1', user)).rejects.toThrow('Delete failed');
    });
  });

  // -----------------------------------------------------------
  // Security: RBAC enforcement
  // -----------------------------------------------------------
  describe('Security - RBAC enforcement', () => {
    it('update should forward USER role user to service for enforcement', async () => {
      const regularUser = makeUser({ id: 'regular-1', role: 'USER' });
      mockOrganizationMemberService.update.mockResolvedValue({});

      await controller.update('member-1', { role: 'OWNER' as any } as any, regularUser);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith(
        'member-1',
        { role: 'OWNER' },
        regularUser,
      );
    });

    it('delete should forward EMPLOYEE role user to service for enforcement', async () => {
      const employee = makeUser({ id: 'emp-1', role: 'EMPLOYEE' });
      mockOrganizationMemberService.delete.mockResolvedValue({});

      await controller.delete('member-1', employee);

      expect(mockOrganizationMemberService.delete).toHaveBeenCalledWith('member-1', employee);
    });

    it('update should forward ADMIN role user to service', async () => {
      const admin = makeUser({ id: 'admin-1', role: 'ADMIN' });
      mockOrganizationMemberService.update.mockResolvedValue({});

      await controller.update('member-1', { role: 'MANAGER' as any } as any, admin);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith(
        'member-1',
        { role: 'MANAGER' },
        admin,
      );
    });

    it('delete should forward MANAGER role user to service', async () => {
      const manager = makeUser({ id: 'mgr-1', role: 'MANAGER' });
      mockOrganizationMemberService.delete.mockResolvedValue({});

      await controller.delete('member-1', manager);

      expect(mockOrganizationMemberService.delete).toHaveBeenCalledWith('member-1', manager);
    });
  });

  // -----------------------------------------------------------
  // Security: Self-modification prevention at controller layer
  // -----------------------------------------------------------
  describe('Security - Self-modification prevention', () => {
    it('should forward user attempting to update own member to service (service enforces)', async () => {
      const user = makeUser({ id: 'self-user' });
      mockOrganizationMemberService.update.mockRejectedValue(
        new ForbiddenException('You cannot edit your own permissions'),
      );

      await expect(
        controller.update('member-self', { role: 'ADMIN' as any } as any, user),
      ).rejects.toThrow('You cannot edit your own permissions');
    });

    it('should forward user attempting to delete own member to service (service enforces)', async () => {
      const user = makeUser({ id: 'self-user' });
      mockOrganizationMemberService.delete.mockRejectedValue(
        new ForbiddenException('You cannot remove yourself from the organization'),
      );

      await expect(controller.delete('member-self', user)).rejects.toThrow(
        'You cannot remove yourself from the organization',
      );
    });
  });

  // -----------------------------------------------------------
  // Security: Privilege escalation
  // -----------------------------------------------------------
  describe('Security - Privilege escalation', () => {
    it('create with OWNER role should be forwarded to service', async () => {
      const dto = { userId: 'u1', organizationId: 'o1', role: 'OWNER' as any };
      mockOrganizationMemberService.create.mockResolvedValue({ id: 'member-1' });

      await controller.create(dto as any);

      expect(mockOrganizationMemberService.create).toHaveBeenCalledWith(dto);
    });

    it('create with ADMIN role should be forwarded to service', async () => {
      const dto = { userId: 'u1', organizationId: 'o1', role: 'ADMIN' as any };
      mockOrganizationMemberService.create.mockResolvedValue({ id: 'member-1' });

      await controller.create(dto as any);

      expect(mockOrganizationMemberService.create).toHaveBeenCalledWith(dto);
    });

    it('update role to OWNER by EMPLOYEE should be forwarded to service for enforcement', async () => {
      const employee = makeUser({ id: 'emp-1', role: 'EMPLOYEE' });
      mockOrganizationMemberService.update.mockResolvedValue({});

      await controller.update('member-1', { role: 'OWNER' as any } as any, employee);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith(
        'member-1',
        { role: 'OWNER' },
        employee,
      );
    });
  });

  // -----------------------------------------------------------
  // Security: Multi-tenancy isolation
  // -----------------------------------------------------------
  describe('Security - Multi-tenancy isolation', () => {
    it('findByOrganizationId should scope to the specified organization', async () => {
      const orgResult = {
        data: [{ id: 'member-1', organizationId: 'org-1' }],
        meta: { total: 1 },
      };
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue(orgResult);

      const result = await controller.findByOrganizationId('org-1', '1', '10');

      expect(mockOrganizationMemberService.findByOrganizationId).toHaveBeenCalledWith('org-1', {
        page: 1,
        perPage: 10,
      });
      expect(result.data[0].organizationId).toBe('org-1');
    });

    it('findByShopId should scope to the specified shop', async () => {
      mockOrganizationMemberService.findByShopId.mockResolvedValue([]);

      await controller.findByShopId('shop-1');

      expect(mockOrganizationMemberService.findByShopId).toHaveBeenCalledWith('shop-1');
    });
  });

  // -----------------------------------------------------------
  // Security: Input validation
  // -----------------------------------------------------------
  describe('Security - Input validation', () => {
    it('should forward SQL injection-like organizationId to service', async () => {
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      await controller.findByOrganizationId("' OR 1=1; --", '1', '10');

      expect(mockOrganizationMemberService.findByOrganizationId).toHaveBeenCalledWith(
        "' OR 1=1; --",
        { page: 1, perPage: 10 },
      );
    });

    it('should forward XSS-like member id to service', async () => {
      mockOrganizationMemberService.findById.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(
        controller.findById('<script>alert("xss")</script>'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle excessively long id parameter', async () => {
      const longId = 'a'.repeat(10000);
      mockOrganizationMemberService.findById.mockResolvedValue(null);

      await controller.findById(longId);

      expect(mockOrganizationMemberService.findById).toHaveBeenCalledWith(longId);
    });
  });

  // -----------------------------------------------------------
  // Security: Data leakage
  // -----------------------------------------------------------
  describe('Security - Data leakage', () => {
    it('findById should not expose user password', async () => {
      const member = {
        id: 'member-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          picture: null,
          // The repo selects only safe fields, no password
        },
        organization: { id: 'org-1' },
        managedShops: [],
      };
      mockOrganizationMemberService.findById.mockResolvedValue(member);

      const result = await controller.findById('member-1');

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('findByOrganizationId should not expose sensitive user data across orgs', async () => {
      const orgMembers = {
        data: [
          {
            id: 'member-1',
            organizationId: 'org-1',
            user: { id: 'u1', firstName: 'Alice', email: 'alice@test.com' },
          },
        ],
        meta: { total: 1 },
      };
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue(orgMembers);

      const result = await controller.findByOrganizationId('org-1', '1', '10');

      // Ensure all returned members belong to the requested org
      for (const member of result.data) {
        expect(member.organizationId).toBe('org-1');
        expect(member.user).not.toHaveProperty('password');
      }
    });
  });

  // -----------------------------------------------------------
  // Security: Member management authorization
  // -----------------------------------------------------------
  describe('Security - Unauthorized member management', () => {
    it('create should forward to service without checking caller identity at controller level', async () => {
      const dto = { userId: 'victim-user', organizationId: 'other-org', role: 'EMPLOYEE' as any };
      mockOrganizationMemberService.create.mockResolvedValue({ id: 'member-1' });

      // Controller does not require @CurrentUser for create - service/use case handles auth
      await controller.create(dto as any);

      expect(mockOrganizationMemberService.create).toHaveBeenCalledWith(dto);
    });

    it('delete should always pass the current user for authorization', async () => {
      const user = makeUser({ id: 'attacker', role: 'EMPLOYEE' });
      mockOrganizationMemberService.delete.mockResolvedValue({});

      await controller.delete('member-1', user);

      // The service receives the current user for authorization
      expect(mockOrganizationMemberService.delete).toHaveBeenCalledWith('member-1', user);
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('findAll should handle zero page', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('0', '10');

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({ page: 0, perPage: 10 });
    });

    it('findAll should handle negative page', async () => {
      mockOrganizationMemberService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('-1', '10');

      expect(mockOrganizationMemberService.findAll).toHaveBeenCalledWith({ page: -1, perPage: 10 });
    });

    it('findByOrganizationId should handle large perPage values', async () => {
      mockOrganizationMemberService.findByOrganizationId.mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      await controller.findByOrganizationId('org-1', '1', '999999');

      expect(mockOrganizationMemberService.findByOrganizationId).toHaveBeenCalledWith('org-1', {
        page: 1,
        perPage: 999999,
      });
    });

    it('update with empty DTO should still forward to service', async () => {
      const user = makeUser();
      mockOrganizationMemberService.update.mockResolvedValue({ id: 'member-1' });

      await controller.update('member-1', {} as any, user);

      expect(mockOrganizationMemberService.update).toHaveBeenCalledWith('member-1', {}, user);
    });
  });
});
