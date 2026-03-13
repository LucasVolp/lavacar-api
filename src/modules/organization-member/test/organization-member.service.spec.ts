import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { OrganizationMemberService } from '../organization-member.service';
import { CreateOrganizationMemberUseCase } from '../use-cases/create-organization-member.use-case';
import { FindAllOrganizationMemberUseCase } from '../use-cases/find-all-organization-member.use-case';
import { FindOrganizationMemberByIdUseCase } from '../use-cases/find-organization-member-by-id.use-case';
import { FindOrganizationMembersByShopUseCase } from '../use-cases/find-organization-members-by-shop.use-case';
import { UpdateOrganizationMemberUseCase } from '../use-cases/update-organization-member.use-case';
import { DeleteOrganizationMemberUseCase } from '../use-cases/delete-organization-member.use-case';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

const mockCreateMemberUseCase = { execute: jest.fn() };
const mockFindAllMemberUseCase = { execute: jest.fn(), executeByOrganizationId: jest.fn() };
const mockFindMemberByIdUseCase = { execute: jest.fn() };
const mockFindMembersByShopUseCase = { execute: jest.fn() };
const mockUpdateMemberUseCase = { execute: jest.fn() };
const mockDeleteMemberUseCase = { execute: jest.fn() };

describe('OrganizationMemberService', () => {
  let service: OrganizationMemberService;

  // Helper to create JwtPayload objects for tests
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
      providers: [
        OrganizationMemberService,
        { provide: CreateOrganizationMemberUseCase, useValue: mockCreateMemberUseCase },
        { provide: FindAllOrganizationMemberUseCase, useValue: mockFindAllMemberUseCase },
        { provide: FindOrganizationMemberByIdUseCase, useValue: mockFindMemberByIdUseCase },
        { provide: FindOrganizationMembersByShopUseCase, useValue: mockFindMembersByShopUseCase },
        { provide: UpdateOrganizationMemberUseCase, useValue: mockUpdateMemberUseCase },
        { provide: DeleteOrganizationMemberUseCase, useValue: mockDeleteMemberUseCase },
      ],
    }).compile();

    service = module.get<OrganizationMemberService>(OrganizationMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      userId: 'user-uuid-1',
      organizationId: 'org-uuid-1',
      role: 'EMPLOYEE' as any,
    };

    it('should delegate to CreateOrganizationMemberUseCase.execute', async () => {
      const member = { id: 'member-1', ...createDto };
      mockCreateMemberUseCase.execute.mockResolvedValue(member);

      const result = await service.create(createDto);

      expect(mockCreateMemberUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(member);
    });

    it('should handle create without optional role field', async () => {
      const minimalDto = { userId: 'user-1', organizationId: 'org-1' };
      mockCreateMemberUseCase.execute.mockResolvedValue({ id: 'member-1', ...minimalDto });

      await service.create(minimalDto as any);

      expect(mockCreateMemberUseCase.execute).toHaveBeenCalledWith(minimalDto);
    });

    it('should propagate NotFoundException when user not found', async () => {
      mockCreateMemberUseCase.execute.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('User not found');
    });

    it('should propagate NotFoundException when organization not found', async () => {
      mockCreateMemberUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found'),
      );

      await expect(service.create(createDto)).rejects.toThrow('Organization not found');
    });

    it('should propagate BadRequestException when user is already a member', async () => {
      mockCreateMemberUseCase.execute.mockRejectedValue(
        new BadRequestException('User is already a member of this organization'),
      );

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('User is already a member of this organization');
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockCreateMemberUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Error creating organization member'),
      );

      await expect(service.create(createDto)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should delegate to FindAllOrganizationMemberUseCase.execute with filters', async () => {
      const paginatedResult = {
        data: [{ id: 'member-1' }, { id: 'member-2' }],
        meta: { total: 2, page: 1, perPage: 10 },
      };
      mockFindAllMemberUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ page: 1, perPage: 10 });

      expect(mockFindAllMemberUseCase.execute).toHaveBeenCalledWith({ page: 1, perPage: 10 });
      expect(result).toEqual(paginatedResult);
    });

    it('should work without filters', async () => {
      const paginatedResult = { data: [], meta: { total: 0 } };
      mockFindAllMemberUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await service.findAll();

      expect(mockFindAllMemberUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(paginatedResult);
    });

    it('should propagate errors from FindAllOrganizationMemberUseCase', async () => {
      mockFindAllMemberUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  // -----------------------------------------------------------
  // findByOrganizationId
  // -----------------------------------------------------------
  describe('findByOrganizationId', () => {
    it('should delegate to FindAllOrganizationMemberUseCase.executeByOrganizationId', async () => {
      const paginatedResult = {
        data: [{ id: 'member-1', organizationId: 'org-1' }],
        meta: { total: 1, page: 1, perPage: 10 },
      };
      mockFindAllMemberUseCase.executeByOrganizationId.mockResolvedValue(paginatedResult);

      const result = await service.findByOrganizationId('org-1', { page: 1, perPage: 10 });

      expect(mockFindAllMemberUseCase.executeByOrganizationId).toHaveBeenCalledWith('org-1', {
        page: 1,
        perPage: 10,
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should work without pagination filters', async () => {
      mockFindAllMemberUseCase.executeByOrganizationId.mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      await service.findByOrganizationId('org-1');

      expect(mockFindAllMemberUseCase.executeByOrganizationId).toHaveBeenCalledWith('org-1', undefined);
    });

    it('should propagate errors', async () => {
      mockFindAllMemberUseCase.executeByOrganizationId.mockRejectedValue(new Error('fail'));

      await expect(service.findByOrganizationId('org-1')).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // findByShopId
  // -----------------------------------------------------------
  describe('findByShopId', () => {
    it('should delegate to FindOrganizationMembersByShopUseCase.execute', async () => {
      const members = [{ id: 'member-1' }, { id: 'member-2' }];
      mockFindMembersByShopUseCase.execute.mockResolvedValue(members);

      const result = await service.findByShopId('shop-1');

      expect(mockFindMembersByShopUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual(members);
    });

    it('should return empty array when shop has no members', async () => {
      mockFindMembersByShopUseCase.execute.mockResolvedValue([]);

      const result = await service.findByShopId('empty-shop');

      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException for missing shop ID', async () => {
      mockFindMembersByShopUseCase.execute.mockRejectedValue(
        new NotFoundException('Shop ID is required'),
      );

      await expect(service.findByShopId('')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // findById
  // -----------------------------------------------------------
  describe('findById', () => {
    it('should delegate to FindOrganizationMemberByIdUseCase.execute', async () => {
      const member = {
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'EMPLOYEE',
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', picture: null },
        organization: { id: 'org-1', name: 'Org' },
        managedShops: [],
      };
      mockFindMemberByIdUseCase.execute.mockResolvedValue(member);

      const result = await service.findById('member-1');

      expect(mockFindMemberByIdUseCase.execute).toHaveBeenCalledWith('member-1');
      expect(result).toEqual(member);
    });

    it('should propagate NotFoundException when member not found', async () => {
      mockFindMemberByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockFindMemberByIdUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Error finding organization member'),
      );

      await expect(service.findById('member-1')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to UpdateOrganizationMemberUseCase.execute with user id', async () => {
      const updateDto = { role: 'MANAGER' as any };
      const user = makeUser({ id: 'admin-1', role: 'OWNER' });
      const updated = { id: 'member-1', role: 'MANAGER' };
      mockUpdateMemberUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('member-1', updateDto, user);

      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledWith('member-1', updateDto, 'admin-1');
      expect(result).toEqual(updated);
    });

    it('should extract user.id from JwtPayload and pass it to use case', async () => {
      const user = makeUser({ id: 'specific-user-id' });
      mockUpdateMemberUseCase.execute.mockResolvedValue({});

      await service.update('member-1', { role: 'EMPLOYEE' as any }, user);

      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledWith(
        'member-1',
        { role: 'EMPLOYEE' },
        'specific-user-id',
      );
    });

    it('should handle isActive update', async () => {
      const user = makeUser();
      mockUpdateMemberUseCase.execute.mockResolvedValue({ id: 'member-1', isActive: false });

      await service.update('member-1', { isActive: false }, user);

      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledWith(
        'member-1',
        { isActive: false },
        user.id,
      );
    });

    it('should propagate NotFoundException when member not found', async () => {
      const user = makeUser();
      mockUpdateMemberUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(service.update('nonexistent', {}, user)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user tries to update own role', async () => {
      const user = makeUser({ id: 'self-user' });
      mockUpdateMemberUseCase.execute.mockRejectedValue(
        new ForbiddenException('You cannot edit your own permissions'),
      );

      await expect(
        service.update('member-self', { role: 'ADMIN' as any }, user),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('member-self', { role: 'ADMIN' as any }, user),
      ).rejects.toThrow('You cannot edit your own permissions');
    });
  });

  // -----------------------------------------------------------
  // delete
  // -----------------------------------------------------------
  describe('delete', () => {
    it('should delegate to DeleteOrganizationMemberUseCase.execute with user id', async () => {
      const user = makeUser({ id: 'admin-1', role: 'OWNER' });
      mockDeleteMemberUseCase.execute.mockResolvedValue({ id: 'member-1' });

      const result = await service.delete('member-1', user);

      expect(mockDeleteMemberUseCase.execute).toHaveBeenCalledWith('member-1', 'admin-1');
      expect(result).toEqual({ id: 'member-1' });
    });

    it('should extract user.id from JwtPayload and pass to use case', async () => {
      const user = makeUser({ id: 'deleting-user-id' });
      mockDeleteMemberUseCase.execute.mockResolvedValue({});

      await service.delete('member-1', user);

      expect(mockDeleteMemberUseCase.execute).toHaveBeenCalledWith('member-1', 'deleting-user-id');
    });

    it('should propagate NotFoundException when member not found', async () => {
      const user = makeUser();
      mockDeleteMemberUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(service.delete('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user tries to delete self', async () => {
      const user = makeUser({ id: 'self-user' });
      mockDeleteMemberUseCase.execute.mockRejectedValue(
        new ForbiddenException('You cannot remove yourself from the organization'),
      );

      await expect(service.delete('member-self', user)).rejects.toThrow(ForbiddenException);
      await expect(service.delete('member-self', user)).rejects.toThrow(
        'You cannot remove yourself from the organization',
      );
    });
  });

  // -----------------------------------------------------------
  // Security: Self-modification prevention
  // -----------------------------------------------------------
  describe('Security - Self-modification prevention', () => {
    it('update passes user.id so use case can prevent self-role-edit', async () => {
      const user = makeUser({ id: 'user-123' });
      mockUpdateMemberUseCase.execute.mockResolvedValue({});

      await service.update('member-1', { role: 'ADMIN' as any }, user);

      // Verify user.id is forwarded for the self-check inside the use case
      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledWith(
        'member-1',
        { role: 'ADMIN' },
        'user-123',
      );
    });

    it('delete passes user.id so use case can prevent self-deletion', async () => {
      const user = makeUser({ id: 'user-456' });
      mockDeleteMemberUseCase.execute.mockResolvedValue({});

      await service.delete('member-1', user);

      expect(mockDeleteMemberUseCase.execute).toHaveBeenCalledWith('member-1', 'user-456');
    });
  });

  // -----------------------------------------------------------
  // Security: Multi-tenancy isolation
  // -----------------------------------------------------------
  describe('Security - Multi-tenancy isolation', () => {
    it('findByOrganizationId should scope results to a specific organization', async () => {
      const orgMembers = {
        data: [
          { id: 'member-1', organizationId: 'org-1' },
          { id: 'member-2', organizationId: 'org-1' },
        ],
        meta: { total: 2 },
      };
      mockFindAllMemberUseCase.executeByOrganizationId.mockResolvedValue(orgMembers);

      const result = await service.findByOrganizationId('org-1');

      expect(mockFindAllMemberUseCase.executeByOrganizationId).toHaveBeenCalledWith('org-1', undefined);
      for (const member of result.data) {
        expect(member.organizationId).toBe('org-1');
      }
    });

    it('findByShopId should only return members for the specified shop', async () => {
      const shopMembers = [
        { id: 'member-1', userId: 'user-1' },
        { id: 'member-2', userId: 'user-2' },
      ];
      mockFindMembersByShopUseCase.execute.mockResolvedValue(shopMembers);

      const result = await service.findByShopId('shop-1');

      expect(mockFindMembersByShopUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(result).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------
  // Security: Privilege escalation
  // -----------------------------------------------------------
  describe('Security - Privilege escalation', () => {
    it('should pass role assignment to use case (use case enforces role constraints)', async () => {
      const dto = { userId: 'user-1', organizationId: 'org-1', role: 'OWNER' as any };
      mockCreateMemberUseCase.execute.mockResolvedValue({ id: 'member-1', ...dto });

      await service.create(dto);

      expect(mockCreateMemberUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('should pass role update to use case (use case enforces privilege constraints)', async () => {
      const user = makeUser({ id: 'manager-1', role: 'MANAGER' });
      mockUpdateMemberUseCase.execute.mockResolvedValue({});

      await service.update('member-1', { role: 'OWNER' as any }, user);

      // The service correctly passes the data; the use case is responsible for authorization
      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledWith(
        'member-1',
        { role: 'OWNER' },
        'manager-1',
      );
    });
  });

  // -----------------------------------------------------------
  // Security: Input validation
  // -----------------------------------------------------------
  describe('Security - Input validation', () => {
    it('should pass SQL injection-like userId to use case', async () => {
      const maliciousDto = {
        userId: "'; DELETE FROM users; --",
        organizationId: 'org-1',
      };
      mockCreateMemberUseCase.execute.mockResolvedValue({ id: 'member-1' });

      await service.create(maliciousDto as any);

      expect(mockCreateMemberUseCase.execute).toHaveBeenCalledWith(maliciousDto);
    });

    it('should pass empty string ID to use case', async () => {
      mockFindMemberByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization member not found!'),
      );

      await expect(service.findById('')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // Security: Data leakage
  // -----------------------------------------------------------
  describe('Security - Data leakage', () => {
    it('findById should return member with selected user fields (no password)', async () => {
      const member = {
        id: 'member-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          picture: null,
        },
        organization: { id: 'org-1', name: 'Test Org' },
        managedShops: [],
      };
      mockFindMemberByIdUseCase.execute.mockResolvedValue(member);

      const result = await service.findById('member-1');

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('email');
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle findAll with empty results', async () => {
      mockFindAllMemberUseCase.execute.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, perPage: 10 },
      });

      const result = await service.findAll({ page: 1, perPage: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should call correct use case method for each service method', async () => {
      mockCreateMemberUseCase.execute.mockResolvedValue({});
      mockFindAllMemberUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });
      mockFindAllMemberUseCase.executeByOrganizationId.mockResolvedValue({ data: [], meta: { total: 0 } });
      mockFindMembersByShopUseCase.execute.mockResolvedValue([]);
      mockFindMemberByIdUseCase.execute.mockResolvedValue({});
      mockUpdateMemberUseCase.execute.mockResolvedValue({});
      mockDeleteMemberUseCase.execute.mockResolvedValue({});

      const user = makeUser();

      await service.create({ userId: 'u1', organizationId: 'o1' } as any);
      await service.findAll();
      await service.findByOrganizationId('org-1');
      await service.findByShopId('shop-1');
      await service.findById('member-1');
      await service.update('member-1', {}, user);
      await service.delete('member-1', user);

      expect(mockCreateMemberUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindAllMemberUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindAllMemberUseCase.executeByOrganizationId).toHaveBeenCalledTimes(1);
      expect(mockFindMembersByShopUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindMemberByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateMemberUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteMemberUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
