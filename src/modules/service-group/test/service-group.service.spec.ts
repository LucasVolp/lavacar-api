import { Test, TestingModule } from '@nestjs/testing';
import { ServiceGroupService } from '../service-group.service';
import { CreateServiceGroupUseCase } from '../use-cases/create-service-group.use-case';
import { FindAllServiceGroupUseCase } from '../use-cases/find-all-service-group.use-case';
import { FindServiceGroupByIdUseCase } from '../use-cases/find-service-group-by-id.use-case';
import { UpdateServiceGroupUseCase } from '../use-cases/update-service-group.use-case';
import { DeleteServiceGroupUseCase } from '../use-cases/delete-service-group.use-case';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { NotFoundException, ForbiddenException, ConflictException, ServiceUnavailableException } from '@nestjs/common';

const mockCreateServiceGroupUseCase = { execute: jest.fn() };
const mockFindAllServiceGroupUseCase = { execute: jest.fn() };
const mockFindServiceGroupByIdUseCase = { execute: jest.fn() };
const mockUpdateServiceGroupUseCase = { execute: jest.fn() };
const mockDeleteServiceGroupUseCase = { execute: jest.fn() };

describe('ServiceGroupService', () => {
  let service: ServiceGroupService;

  const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
  const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
  const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
  const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };
  const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511555555555', role: 'USER' };

  const mockShopId = '550e8400-e29b-41d4-a716-446655440000';
  const mockGroupId = '660e8400-e29b-41d4-a716-446655440000';

  const validCreateDto = {
    name: 'Lavagens',
    description: 'Grupo de servicos de lavagem',
    isActive: true,
    shopId: mockShopId,
  };

  const mockGroupResult = {
    id: mockGroupId,
    name: 'Lavagens',
    description: 'Grupo de servicos de lavagem',
    isActive: true,
    shopId: mockShopId,
    createdAt: new Date(),
    updatedAt: new Date(),
    services: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceGroupService,
        { provide: CreateServiceGroupUseCase, useValue: mockCreateServiceGroupUseCase },
        { provide: FindAllServiceGroupUseCase, useValue: mockFindAllServiceGroupUseCase },
        { provide: FindServiceGroupByIdUseCase, useValue: mockFindServiceGroupByIdUseCase },
        { provide: UpdateServiceGroupUseCase, useValue: mockUpdateServiceGroupUseCase },
        { provide: DeleteServiceGroupUseCase, useValue: mockDeleteServiceGroupUseCase },
      ],
    }).compile();

    service = module.get<ServiceGroupService>(ServiceGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to CreateServiceGroupUseCase with data and user', async () => {
      mockCreateServiceGroupUseCase.execute.mockResolvedValue(mockGroupResult);

      const result = await service.create(validCreateDto, adminUser);

      expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(validCreateDto, adminUser);
      expect(result).toEqual(mockGroupResult);
    });

    it('should pass the exact DTO fields to the use case', async () => {
      const dto = { ...validCreateDto, isActive: false };
      mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, isActive: false });

      await service.create(dto, ownerUser);

      expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(dto, ownerUser);
    });

    it('should create group without optional description', async () => {
      const dtoWithoutDesc = { name: 'Polimentos', shopId: mockShopId };
      mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, ...dtoWithoutDesc, description: null });

      const result = await service.create(dtoWithoutDesc, adminUser);

      expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(dtoWithoutDesc, adminUser);
      expect(result.description).toBeNull();
    });

    it('should create group without optional isActive (defaults server-side)', async () => {
      const dtoWithoutActive = { name: 'Polimentos', shopId: mockShopId };
      mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, ...dtoWithoutActive });

      await service.create(dtoWithoutActive, adminUser);

      expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(dtoWithoutActive, adminUser);
    });

    it('should propagate NotFoundException when shop not found', async () => {
      mockCreateServiceGroupUseCase.execute.mockRejectedValue(
        new NotFoundException('Shop not found for creating service group'),
      );

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(NotFoundException);
      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow('Shop not found for creating service group');
    });

    it('should propagate ForbiddenException when user lacks shop access', async () => {
      mockCreateServiceGroupUseCase.execute.mockRejectedValue(
        new ForbiddenException('You are not allowed to access this shop'),
      );

      await expect(service.create(validCreateDto, employeeUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ForbiddenException for non-scoped roles', async () => {
      mockCreateServiceGroupUseCase.execute.mockRejectedValue(
        new ForbiddenException('Role not allowed for internal shop-scoped resources'),
      );

      await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockCreateServiceGroupUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should forward different user roles to the use case', async () => {
      mockCreateServiceGroupUseCase.execute.mockResolvedValue(mockGroupResult);

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.create(validCreateDto, user);
        expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(validCreateDto, user);
      }

      expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledTimes(4);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    const paginatedResult = {
      data: [mockGroupResult],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to FindAllServiceGroupUseCase with filters and user', async () => {
      mockFindAllServiceGroupUseCase.execute.mockResolvedValue(paginatedResult);
      const filters = { shopId: mockShopId, page: 1, perPage: 10 };

      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass default empty filters when none provided', async () => {
      const emptyResult = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
      mockFindAllServiceGroupUseCase.execute.mockResolvedValue(emptyResult);

      await service.findAll({}, adminUser);

      expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should pass default empty object when filters argument omitted', async () => {
      const emptyResult = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
      mockFindAllServiceGroupUseCase.execute.mockResolvedValue(emptyResult);

      await service.findAll(undefined, adminUser);

      // When filters is undefined, the method's default parameter (= {}) converts it to an empty object
      expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should support shopId filter', async () => {
      mockFindAllServiceGroupUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll({ shopId: mockShopId }, ownerUser);

      expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith({ shopId: mockShopId }, ownerUser);
    });

    it('should support pagination filters', async () => {
      mockFindAllServiceGroupUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll({ page: 2, perPage: 5 }, adminUser);

      expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith({ page: 2, perPage: 5 }, adminUser);
    });

    it('should propagate errors from FindAllServiceGroupUseCase', async () => {
      mockFindAllServiceGroupUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findAll({}, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindServiceGroupByIdUseCase with id and user', async () => {
      mockFindServiceGroupByIdUseCase.execute.mockResolvedValue(mockGroupResult);

      const result = await service.findOne(mockGroupId, adminUser);

      expect(mockFindServiceGroupByIdUseCase.execute).toHaveBeenCalledWith(mockGroupId, adminUser);
      expect(result).toEqual(mockGroupResult);
    });

    it('should propagate NotFoundException when group not found', async () => {
      mockFindServiceGroupByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Service group not found'),
      );

      await expect(service.findOne('non-existent-id', adminUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id', adminUser)).rejects.toThrow('Service group not found');
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockFindServiceGroupByIdUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findOne(mockGroupId, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for shop-scoped access', async () => {
      mockFindServiceGroupByIdUseCase.execute.mockResolvedValue(mockGroupResult);

      await service.findOne(mockGroupId, ownerUser);

      expect(mockFindServiceGroupByIdUseCase.execute).toHaveBeenCalledWith(mockGroupId, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { name: 'Polimentos Premium' };
    const updatedResult = { ...mockGroupResult, ...updateDto };

    it('should delegate to UpdateServiceGroupUseCase with id, data and user', async () => {
      mockUpdateServiceGroupUseCase.execute.mockResolvedValue(updatedResult);

      const result = await service.update(mockGroupId, updateDto, adminUser);

      expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, updateDto, adminUser);
      expect(result).toEqual(updatedResult);
    });

    it('should allow partial update with only name', async () => {
      const partialDto = { name: 'Novo Nome' };
      mockUpdateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, ...partialDto });

      await service.update(mockGroupId, partialDto, adminUser);

      expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, partialDto, adminUser);
    });

    it('should allow partial update with only description', async () => {
      const partialDto = { description: 'Nova descricao' };
      mockUpdateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, ...partialDto });

      await service.update(mockGroupId, partialDto, adminUser);

      expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, partialDto, adminUser);
    });

    it('should allow updating isActive status', async () => {
      const partialDto = { isActive: false };
      mockUpdateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, ...partialDto });

      await service.update(mockGroupId, partialDto, adminUser);

      expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, partialDto, adminUser);
    });

    it('should propagate NotFoundException when group not found', async () => {
      mockUpdateServiceGroupUseCase.execute.mockRejectedValue(
        new NotFoundException('Service group not found'),
      );

      await expect(service.update('non-existent-id', updateDto, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException for duplicate group name', async () => {
      mockUpdateServiceGroupUseCase.execute.mockRejectedValue(
        new ConflictException('Service group with this name already exists for this shop'),
      );

      await expect(service.update(mockGroupId, { name: 'Existing' }, adminUser)).rejects.toThrow(ConflictException);
      await expect(service.update(mockGroupId, { name: 'Existing' }, adminUser)).rejects.toThrow(
        'Service group with this name already exists for this shop',
      );
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockUpdateServiceGroupUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.update(mockGroupId, updateDto, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteServiceGroupUseCase with id and user', async () => {
      const deleteResult = { message: 'Service group deleted successfully' };
      mockDeleteServiceGroupUseCase.execute.mockResolvedValue(deleteResult);

      const result = await service.remove(mockGroupId, adminUser);

      expect(mockDeleteServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, adminUser);
      expect(result).toEqual(deleteResult);
    });

    it('should propagate NotFoundException when group not found', async () => {
      mockDeleteServiceGroupUseCase.execute.mockRejectedValue(
        new NotFoundException('Service group not found'),
      );

      await expect(service.remove('non-existent-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockDeleteServiceGroupUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.remove(mockGroupId, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for shop-scoped deletion', async () => {
      mockDeleteServiceGroupUseCase.execute.mockResolvedValue({ message: 'Service group deleted successfully' });

      await service.remove(mockGroupId, ownerUser);

      expect(mockDeleteServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // Security tests
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('Shop scope isolation', () => {
      it('should pass user context to create for shop scope enforcement', async () => {
        mockCreateServiceGroupUseCase.execute.mockResolvedValue(mockGroupResult);

        await service.create(validCreateDto, ownerUser);

        expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          ownerUser,
        );
      });

      it('should pass user context to findAll for shop scope enforcement', async () => {
        mockFindAllServiceGroupUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

        await service.findAll({ shopId: mockShopId }, employeeUser);

        expect(mockFindAllServiceGroupUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          employeeUser,
        );
      });

      it('should pass user context to findOne for shop scope enforcement', async () => {
        mockFindServiceGroupByIdUseCase.execute.mockResolvedValue(mockGroupResult);

        await service.findOne(mockGroupId, managerUser);

        expect(mockFindServiceGroupByIdUseCase.execute).toHaveBeenCalledWith(mockGroupId, managerUser);
      });

      it('should pass user context to update for shop scope enforcement', async () => {
        mockUpdateServiceGroupUseCase.execute.mockResolvedValue(mockGroupResult);

        await service.update(mockGroupId, { name: 'Test' }, managerUser);

        expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, { name: 'Test' }, managerUser);
      });

      it('should pass user context to remove for shop scope enforcement', async () => {
        mockDeleteServiceGroupUseCase.execute.mockResolvedValue({ message: 'deleted' });

        await service.remove(mockGroupId, ownerUser);

        expect(mockDeleteServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, ownerUser);
      });
    });

    describe('Unauthorized access propagation', () => {
      it('should propagate ForbiddenException when non-scoped role tries to create', async () => {
        mockCreateServiceGroupUseCase.execute.mockRejectedValue(
          new ForbiddenException('Role not allowed for internal shop-scoped resources'),
        );

        await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException when user tries to access another shop', async () => {
        mockFindAllServiceGroupUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.findAll({ shopId: 'other-shop-id' }, employeeUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on findOne for unauthorized shop access', async () => {
        mockFindServiceGroupByIdUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.findOne(mockGroupId, employeeUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on update for unauthorized shop access', async () => {
        mockUpdateServiceGroupUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.update(mockGroupId, { name: 'Hacked' }, regularUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on remove for unauthorized shop access', async () => {
        mockDeleteServiceGroupUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.remove(mockGroupId, regularUser)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Input validation (XSS prevention at DTO level)', () => {
      it('should forward XSS-like group name to use case (DTO validation responsibility)', async () => {
        const xssDto = { ...validCreateDto, name: '<script>alert("xss")</script>' };
        mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, name: xssDto.name });

        await service.create(xssDto, adminUser);

        expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ name: '<script>alert("xss")</script>' }),
          adminUser,
        );
      });

      it('should forward XSS-like description to use case', async () => {
        const xssDto = { ...validCreateDto, description: '<img src=x onerror=alert(1)>' };
        mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, description: xssDto.description });

        await service.create(xssDto, adminUser);

        expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ description: '<img src=x onerror=alert(1)>' }),
          adminUser,
        );
      });

      it('should forward SQL injection-like name to use case', async () => {
        const sqlDto = { ...validCreateDto, name: "'; DROP TABLE service_groups; --" };
        mockCreateServiceGroupUseCase.execute.mockResolvedValue({ ...mockGroupResult, name: sqlDto.name });

        await service.create(sqlDto, adminUser);

        expect(mockCreateServiceGroupUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ name: "'; DROP TABLE service_groups; --" }),
          adminUser,
        );
      });
    });

    describe('Data integrity', () => {
      it('should propagate ConflictException for duplicate group name', async () => {
        mockCreateServiceGroupUseCase.execute.mockRejectedValue(
          new ConflictException('Service group with this name already exists for this shop'),
        );

        await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(ConflictException);
      });

      it('should propagate ConflictException for duplicate name on update', async () => {
        mockUpdateServiceGroupUseCase.execute.mockRejectedValue(
          new ConflictException('Service group with this name already exists for this shop'),
        );

        await expect(service.update(mockGroupId, { name: 'Existing' }, adminUser)).rejects.toThrow(ConflictException);
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle empty string id on findOne', async () => {
      mockFindServiceGroupByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Service group not found'),
      );

      await expect(service.findOne('', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty update DTO', async () => {
      mockUpdateServiceGroupUseCase.execute.mockResolvedValue(mockGroupResult);

      await service.update(mockGroupId, {}, adminUser);

      expect(mockUpdateServiceGroupUseCase.execute).toHaveBeenCalledWith(mockGroupId, {}, adminUser);
    });

    it('should handle concurrent calls independently', async () => {
      mockFindServiceGroupByIdUseCase.execute
        .mockResolvedValueOnce({ ...mockGroupResult, id: 'group-1' })
        .mockResolvedValueOnce({ ...mockGroupResult, id: 'group-2' });

      const [result1, result2] = await Promise.all([
        service.findOne('group-1', adminUser),
        service.findOne('group-2', adminUser),
      ]);

      expect(result1.id).toBe('group-1');
      expect(result2.id).toBe('group-2');
      expect(mockFindServiceGroupByIdUseCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
