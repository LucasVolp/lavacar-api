import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from '../service.service';
import { CreateServiceUseCase } from '../use-cases/create-service.use-case';
import { FindAllServicesUseCase } from '../use-cases/find-all-services.use-case';
import { FindServiceByIdUseCase } from '../use-cases/find-service-by-id.use-case';
import { UpdateServiceUseCase } from '../use-cases/update-service.use-case';
import { DeleteServiceUseCase } from '../use-cases/delete-service.use-case';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { NotFoundException, ForbiddenException, ConflictException, ServiceUnavailableException } from '@nestjs/common';

const mockCreateServiceUseCase = { execute: jest.fn() };
const mockFindAllServicesUseCase = { execute: jest.fn(), executePublic: jest.fn() };
const mockFindServiceByIdUseCase = { execute: jest.fn() };
const mockUpdateServiceUseCase = { execute: jest.fn() };
const mockDeleteServiceUseCase = { execute: jest.fn() };

describe('ServiceService', () => {
  let service: ServiceService;

  const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
  const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
  const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
  const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };
  const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511555555555', role: 'USER' };

  const mockShopId = '550e8400-e29b-41d4-a716-446655440000';
  const mockGroupId = '660e8400-e29b-41d4-a716-446655440000';
  const mockServiceId = '770e8400-e29b-41d4-a716-446655440000';

  const validCreateDto = {
    name: 'Lavagem Completa',
    description: 'Lavagem interna e externa',
    price: 89.90,
    duration: 60,
    isActive: true,
    shopId: mockShopId,
    groupId: mockGroupId,
  };

  const mockServiceResult = {
    id: mockServiceId,
    ...validCreateDto,
    photoUrl: null,
    isBudgetOnly: false,
    hasVariants: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    shop: { id: mockShopId, name: 'Test Shop', organizationId: 'org-1' },
    group: { id: mockGroupId, name: 'Lavagens' },
    variants: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        { provide: CreateServiceUseCase, useValue: mockCreateServiceUseCase },
        { provide: FindAllServicesUseCase, useValue: mockFindAllServicesUseCase },
        { provide: FindServiceByIdUseCase, useValue: mockFindServiceByIdUseCase },
        { provide: UpdateServiceUseCase, useValue: mockUpdateServiceUseCase },
        { provide: DeleteServiceUseCase, useValue: mockDeleteServiceUseCase },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to CreateServiceUseCase with data and user', async () => {
      mockCreateServiceUseCase.execute.mockResolvedValue(mockServiceResult);

      const result = await service.create(validCreateDto, adminUser);

      expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(validCreateDto, adminUser);
      expect(result).toEqual(mockServiceResult);
    });

    it('should pass the exact DTO fields to the use case', async () => {
      const dto = { ...validCreateDto, isBudgetOnly: true, hasVariants: true };
      mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, ...dto });

      await service.create(dto, ownerUser);

      expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(dto, ownerUser);
    });

    it('should create service without optional groupId', async () => {
      const dtoWithoutGroup = { ...validCreateDto, groupId: undefined };
      mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, groupId: null, group: null });

      const result = await service.create(dtoWithoutGroup, adminUser);

      expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(dtoWithoutGroup, adminUser);
      expect(result.group).toBeNull();
    });

    it('should propagate NotFoundException when shop not found', async () => {
      mockCreateServiceUseCase.execute.mockRejectedValue(new NotFoundException('Shop not found'));

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(NotFoundException);
      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow('Shop not found');
    });

    it('should propagate NotFoundException when group not found', async () => {
      mockCreateServiceUseCase.execute.mockRejectedValue(new NotFoundException('Service group not found'));

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow('Service group not found');
    });

    it('should propagate ConflictException for duplicate service name in the same shop', async () => {
      mockCreateServiceUseCase.execute.mockRejectedValue(
        new ConflictException('Service with this name already exists for this shop'),
      );

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(ConflictException);
    });

    it('should propagate ForbiddenException when user lacks shop access', async () => {
      mockCreateServiceUseCase.execute.mockRejectedValue(
        new ForbiddenException('You are not allowed to access this shop'),
      );

      await expect(service.create(validCreateDto, employeeUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockCreateServiceUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should forward different user roles to the use case', async () => {
      mockCreateServiceUseCase.execute.mockResolvedValue(mockServiceResult);

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.create(validCreateDto, user);
        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(validCreateDto, user);
      }

      expect(mockCreateServiceUseCase.execute).toHaveBeenCalledTimes(4);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    const paginatedResult = {
      data: [mockServiceResult],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to FindAllServicesUseCase with filters and user', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue(paginatedResult);
      const filters = { shopId: mockShopId, page: 1, perPage: 10 };

      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass default empty filters when none provided', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

      await service.findAll({}, adminUser);

      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should pass default empty object when filters argument omitted', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

      await service.findAll(undefined, adminUser);

      // When filters is undefined, the method's default parameter (= {}) converts it to an empty object
      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should support groupId filter', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue(paginatedResult);
      const filters = { shopId: mockShopId, groupId: mockGroupId };

      await service.findAll(filters, adminUser);

      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
    });

    it('should support search filter', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue(paginatedResult);
      const filters = { search: 'Lavagem' };

      await service.findAll(filters, adminUser);

      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
    });

    it('should support isActive filter', async () => {
      mockFindAllServicesUseCase.execute.mockResolvedValue(paginatedResult);
      const filters = { isActive: true };

      await service.findAll(filters, adminUser);

      expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
    });

    it('should propagate errors from FindAllServicesUseCase', async () => {
      mockFindAllServicesUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findAll({}, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findPublicServices
  // -----------------------------------------------------------
  describe('findPublicServices', () => {
    const publicResult = {
      data: [{ id: mockServiceId, name: 'Lavagem Completa', price: 89.90 }],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to FindAllServicesUseCase.executePublic with filters', async () => {
      mockFindAllServicesUseCase.executePublic.mockResolvedValue(publicResult);
      const filters = { shopId: mockShopId };

      const result = await service.findPublicServices(filters);

      expect(mockFindAllServicesUseCase.executePublic).toHaveBeenCalledWith(filters);
      expect(result).toEqual(publicResult);
    });

    it('should work with default empty filters', async () => {
      mockFindAllServicesUseCase.executePublic.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

      await service.findPublicServices();

      expect(mockFindAllServicesUseCase.executePublic).toHaveBeenCalledWith({});
    });

    it('should NOT require user authentication (public endpoint)', async () => {
      mockFindAllServicesUseCase.executePublic.mockResolvedValue(publicResult);

      // Verify no user parameter is passed
      await service.findPublicServices({ shopId: mockShopId });

      expect(mockFindAllServicesUseCase.executePublic).toHaveBeenCalledWith({ shopId: mockShopId });
      expect(mockFindAllServicesUseCase.executePublic.mock.calls[0]).toHaveLength(1);
    });

    it('should support search filter on public endpoint', async () => {
      mockFindAllServicesUseCase.executePublic.mockResolvedValue(publicResult);

      await service.findPublicServices({ shopId: mockShopId, search: 'Polimento' });

      expect(mockFindAllServicesUseCase.executePublic).toHaveBeenCalledWith({ shopId: mockShopId, search: 'Polimento' });
    });

    it('should propagate errors from executePublic', async () => {
      mockFindAllServicesUseCase.executePublic.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findPublicServices({ shopId: mockShopId })).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindServiceByIdUseCase with id and user', async () => {
      mockFindServiceByIdUseCase.execute.mockResolvedValue(mockServiceResult);

      const result = await service.findOne(mockServiceId, adminUser);

      expect(mockFindServiceByIdUseCase.execute).toHaveBeenCalledWith(mockServiceId, adminUser);
      expect(result).toEqual(mockServiceResult);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockFindServiceByIdUseCase.execute.mockRejectedValue(new NotFoundException('Service not found!'));

      await expect(service.findOne('non-existent-id', adminUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id', adminUser)).rejects.toThrow('Service not found!');
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockFindServiceByIdUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findOne(mockServiceId, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for shop-scoped access', async () => {
      mockFindServiceByIdUseCase.execute.mockResolvedValue(mockServiceResult);

      await service.findOne(mockServiceId, ownerUser);

      expect(mockFindServiceByIdUseCase.execute).toHaveBeenCalledWith(mockServiceId, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { name: 'Lavagem Premium', price: 129.90 };
    const updatedResult = { ...mockServiceResult, ...updateDto };

    it('should delegate to UpdateServiceUseCase with id, data and user', async () => {
      mockUpdateServiceUseCase.execute.mockResolvedValue(updatedResult);

      const result = await service.update(mockServiceId, updateDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, updateDto, adminUser);
      expect(result).toEqual(updatedResult);
    });

    it('should allow partial update with only name', async () => {
      const partialDto = { name: 'Novo Nome' };
      mockUpdateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, ...partialDto });

      await service.update(mockServiceId, partialDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, partialDto, adminUser);
    });

    it('should allow partial update with only price', async () => {
      const partialDto = { price: 199.99 };
      mockUpdateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, ...partialDto });

      await service.update(mockServiceId, partialDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, partialDto, adminUser);
    });

    it('should allow updating isActive status', async () => {
      const partialDto = { isActive: false };
      mockUpdateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, ...partialDto });

      await service.update(mockServiceId, partialDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, partialDto, adminUser);
    });

    it('should allow updating groupId', async () => {
      const newGroupId = '880e8400-e29b-41d4-a716-446655440000';
      const partialDto = { groupId: newGroupId };
      mockUpdateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, groupId: newGroupId });

      await service.update(mockServiceId, partialDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, partialDto, adminUser);
    });

    it('should allow updating photoUrl', async () => {
      const partialDto = { photoUrl: 'https://cdn.example.com/photo.webp' };
      mockUpdateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, ...partialDto });

      await service.update(mockServiceId, partialDto, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, partialDto, adminUser);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockUpdateServiceUseCase.execute.mockRejectedValue(new NotFoundException('Service not found!'));

      await expect(service.update('non-existent-id', updateDto, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate NotFoundException when shop not found during update', async () => {
      const dto = { shopId: 'invalid-shop-id' };
      mockUpdateServiceUseCase.execute.mockRejectedValue(new NotFoundException('Shop not found'));

      await expect(service.update(mockServiceId, dto, adminUser)).rejects.toThrow('Shop not found');
    });

    it('should propagate NotFoundException when group not found during update', async () => {
      const dto = { groupId: 'invalid-group-id' };
      mockUpdateServiceUseCase.execute.mockRejectedValue(new NotFoundException('Service group not found'));

      await expect(service.update(mockServiceId, dto, adminUser)).rejects.toThrow('Service group not found');
    });

    it('should propagate ConflictException for duplicate service name', async () => {
      mockUpdateServiceUseCase.execute.mockRejectedValue(
        new ConflictException('Service with this name already exists for this shop'),
      );

      await expect(service.update(mockServiceId, { name: 'Existing Name' }, adminUser)).rejects.toThrow(ConflictException);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteServiceUseCase with id and user', async () => {
      mockDeleteServiceUseCase.execute.mockResolvedValue(mockServiceResult);

      const result = await service.remove(mockServiceId, adminUser);

      expect(mockDeleteServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, adminUser);
      expect(result).toEqual(mockServiceResult);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockDeleteServiceUseCase.execute.mockRejectedValue(new NotFoundException('Service not found!'));

      await expect(service.remove('non-existent-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockDeleteServiceUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.remove(mockServiceId, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for shop-scoped deletion', async () => {
      mockDeleteServiceUseCase.execute.mockResolvedValue(mockServiceResult);

      await service.remove(mockServiceId, ownerUser);

      expect(mockDeleteServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // Security tests
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('Shop scope isolation', () => {
      it('should pass user context to create for shop scope enforcement', async () => {
        mockCreateServiceUseCase.execute.mockResolvedValue(mockServiceResult);

        await service.create(validCreateDto, ownerUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          ownerUser,
        );
      });

      it('should pass user context to findAll for shop scope enforcement', async () => {
        mockFindAllServicesUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

        await service.findAll({ shopId: mockShopId }, employeeUser);

        expect(mockFindAllServicesUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          employeeUser,
        );
      });

      it('should pass user context to findOne for shop scope enforcement', async () => {
        mockFindServiceByIdUseCase.execute.mockResolvedValue(mockServiceResult);

        await service.findOne(mockServiceId, managerUser);

        expect(mockFindServiceByIdUseCase.execute).toHaveBeenCalledWith(mockServiceId, managerUser);
      });

      it('should pass user context to update for shop scope enforcement', async () => {
        mockUpdateServiceUseCase.execute.mockResolvedValue(mockServiceResult);

        await service.update(mockServiceId, { name: 'Test' }, managerUser);

        expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, { name: 'Test' }, managerUser);
      });

      it('should pass user context to remove for shop scope enforcement', async () => {
        mockDeleteServiceUseCase.execute.mockResolvedValue(mockServiceResult);

        await service.remove(mockServiceId, ownerUser);

        expect(mockDeleteServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, ownerUser);
      });
    });

    describe('Unauthorized access propagation', () => {
      it('should propagate ForbiddenException when non-scoped role tries to create', async () => {
        mockCreateServiceUseCase.execute.mockRejectedValue(
          new ForbiddenException('Role not allowed for internal shop-scoped resources'),
        );

        await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException when user tries to access another shop', async () => {
        mockFindAllServicesUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.findAll({ shopId: 'other-shop-id' }, employeeUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on findOne for unauthorized shop access', async () => {
        mockFindServiceByIdUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.findOne(mockServiceId, employeeUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on update for unauthorized shop access', async () => {
        mockUpdateServiceUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.update(mockServiceId, { name: 'Hacked' }, regularUser)).rejects.toThrow(ForbiddenException);
      });

      it('should propagate ForbiddenException on remove for unauthorized shop access', async () => {
        mockDeleteServiceUseCase.execute.mockRejectedValue(
          new ForbiddenException('You are not allowed to access this shop'),
        );

        await expect(service.remove(mockServiceId, regularUser)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Price manipulation protection', () => {
      it('should forward negative price to use case (validated at DTO level)', async () => {
        const dto = { ...validCreateDto, price: -10 };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, price: -10 });

        await service.create(dto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ price: -10 }),
          adminUser,
        );
      });

      it('should forward zero price to use case', async () => {
        const dto = { ...validCreateDto, price: 0 };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, price: 0 });

        await service.create(dto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ price: 0 }),
          adminUser,
        );
      });

      it('should forward extremely high price to use case', async () => {
        const dto = { ...validCreateDto, price: 999999.99 };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, price: 999999.99 });

        await service.create(dto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ price: 999999.99 }),
          adminUser,
        );
      });
    });

    describe('Input validation (XSS prevention at DTO level)', () => {
      it('should forward XSS-like service name to use case (DTO validation responsibility)', async () => {
        const xssDto = { ...validCreateDto, name: '<script>alert("xss")</script>' };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, name: xssDto.name });

        await service.create(xssDto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ name: '<script>alert("xss")</script>' }),
          adminUser,
        );
      });

      it('should forward XSS-like description to use case', async () => {
        const xssDto = { ...validCreateDto, description: '<img src=x onerror=alert(1)>' };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, description: xssDto.description });

        await service.create(xssDto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ description: '<img src=x onerror=alert(1)>' }),
          adminUser,
        );
      });

      it('should forward SQL injection-like name to use case', async () => {
        const sqlDto = { ...validCreateDto, name: "'; DROP TABLE services; --" };
        mockCreateServiceUseCase.execute.mockResolvedValue({ ...mockServiceResult, name: sqlDto.name });

        await service.create(sqlDto, adminUser);

        expect(mockCreateServiceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ name: "'; DROP TABLE services; --" }),
          adminUser,
        );
      });
    });

    describe('Data integrity', () => {
      it('should propagate ConflictException for duplicate service name', async () => {
        mockCreateServiceUseCase.execute.mockRejectedValue(
          new ConflictException('Service with this name already exists for this shop'),
        );

        await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(ConflictException);
        await expect(service.create(validCreateDto, adminUser)).rejects.toThrow(
          'Service with this name already exists for this shop',
        );
      });

      it('should propagate ConflictException for duplicate name on update', async () => {
        mockUpdateServiceUseCase.execute.mockRejectedValue(
          new ConflictException('Service with this name already exists for this shop'),
        );

        await expect(service.update(mockServiceId, { name: 'Existing' }, adminUser)).rejects.toThrow(ConflictException);
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle empty string id on findOne', async () => {
      mockFindServiceByIdUseCase.execute.mockRejectedValue(new NotFoundException('Service not found!'));

      await expect(service.findOne('', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty update DTO', async () => {
      mockUpdateServiceUseCase.execute.mockResolvedValue(mockServiceResult);

      await service.update(mockServiceId, {}, adminUser);

      expect(mockUpdateServiceUseCase.execute).toHaveBeenCalledWith(mockServiceId, {}, adminUser);
    });

    it('should handle concurrent calls independently', async () => {
      mockFindServiceByIdUseCase.execute
        .mockResolvedValueOnce({ ...mockServiceResult, id: 'service-1' })
        .mockResolvedValueOnce({ ...mockServiceResult, id: 'service-2' });

      const [result1, result2] = await Promise.all([
        service.findOne('service-1', adminUser),
        service.findOne('service-2', adminUser),
      ]);

      expect(result1.id).toBe('service-1');
      expect(result2.id).toBe('service-2');
      expect(mockFindServiceByIdUseCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
