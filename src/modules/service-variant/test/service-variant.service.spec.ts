import { Test, TestingModule } from '@nestjs/testing';
import { ServiceVariantService } from '../service-variant.service';
import { CreateServiceVariantUseCase } from '../use-cases/create-service-variant.use-case';
import { FindAllServiceVariantUseCase } from '../use-cases/find-all-service-variant.use-case';
import { FindServiceVariantByIdUseCase } from '../use-cases/find-service-variant-by-id.use-case';
import { UpdateServiceVariantUseCase } from '../use-cases/update-service-variant.use-case';
import { DeleteServiceVariantUseCase } from '../use-cases/delete-service-variant.use-case';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindAllUseCase = { execute: jest.fn() };
const mockFindByIdUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };

describe('ServiceVariantService', () => {
  let service: ServiceVariantService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceVariantService,
        { provide: CreateServiceVariantUseCase, useValue: mockCreateUseCase },
        { provide: FindAllServiceVariantUseCase, useValue: mockFindAllUseCase },
        { provide: FindServiceVariantByIdUseCase, useValue: mockFindByIdUseCase },
        { provide: UpdateServiceVariantUseCase, useValue: mockUpdateUseCase },
        { provide: DeleteServiceVariantUseCase, useValue: mockDeleteUseCase },
      ],
    }).compile();

    service = module.get<ServiceVariantService>(ServiceVariantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    const validDto = {
      price: 49.90,
      duration: 30,
      size: 'SMALL' as const,
      serviceId: 'service-uuid-1',
    };

    it('should delegate to CreateServiceVariantUseCase with data and user', async () => {
      const created = { id: 'variant-1', ...validDto };
      mockCreateUseCase.execute.mockResolvedValue(created);

      const result = await service.create(validDto as any, adminUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, adminUser);
      expect(result).toEqual(created);
    });

    it('should pass user context for all roles', async () => {
      mockCreateUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.create(validDto as any, ownerUser);
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, ownerUser);

      await service.create(validDto as any, managerUser);
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, managerUser);

      await service.create(validDto as any, employeeUser);
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validDto, employeeUser);
    });

    it('should propagate NotFoundException from use case', async () => {
      mockCreateUseCase.execute.mockRejectedValue(new NotFoundException('Service not found'));

      await expect(service.create(validDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException from use case (duplicate size)', async () => {
      mockCreateUseCase.execute.mockRejectedValue(
        new ConflictException('Variant for this size already exists in this service'),
      );

      await expect(service.create(validDto as any, adminUser)).rejects.toThrow(ConflictException);
    });

    it('should propagate ServiceUnavailableException from use case', async () => {
      mockCreateUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.create(validDto as any, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Security: price manipulation ---
    describe('Security - price manipulation', () => {
      it('should forward negative price to use case (validation at DTO level)', async () => {
        const dto = { ...validDto, price: -100 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward zero price to use case', async () => {
        const dto = { ...validDto, price: 0 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward extremely large price to use case', async () => {
        const dto = { ...validDto, price: Number.MAX_SAFE_INTEGER };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward NaN price to use case (validation at DTO level)', async () => {
        const dto = { ...validDto, price: NaN };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward Infinity price to use case (validation at DTO level)', async () => {
        const dto = { ...validDto, price: Infinity };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: duration manipulation ---
    describe('Security - duration manipulation', () => {
      it('should forward zero duration to use case', async () => {
        const dto = { ...validDto, duration: 0 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward negative duration to use case', async () => {
        const dto = { ...validDto, duration: -60 };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: VehicleSize validation ---
    describe('Security - invalid VehicleSize', () => {
      it('should forward invalid size string to use case (validation at DTO level)', async () => {
        const dto = { ...validDto, size: 'EXTRA_LARGE' };
        mockCreateUseCase.execute.mockResolvedValue({ id: 'v1', ...dto });

        await service.create(dto as any, adminUser);

        expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should delegate to FindAllServiceVariantUseCase with filters and user', async () => {
      const variants = [{ id: 'v1' }, { id: 'v2' }];
      mockFindAllUseCase.execute.mockResolvedValue(variants);

      const filters = { serviceId: 'svc-1', shopId: 'shop-1', page: 1, perPage: 10 };
      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(variants);
    });

    it('should work with default empty filters', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([]);

      const result = await service.findAll({}, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith({}, adminUser);
      expect(result).toEqual([]);
    });

    it('should work with only serviceId filter', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([{ id: 'v1' }]);

      const result = await service.findAll({ serviceId: 'svc-1' }, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith({ serviceId: 'svc-1' }, adminUser);
      expect(result).toEqual([{ id: 'v1' }]);
    });

    it('should work with only shopId filter', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([{ id: 'v1' }]);

      const result = await service.findAll({ shopId: 'shop-1' }, adminUser);

      expect(mockFindAllUseCase.execute).toHaveBeenCalledWith({ shopId: 'shop-1' }, adminUser);
    });

    it('should propagate errors from FindAllServiceVariantUseCase', async () => {
      mockFindAllUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findAll({}, adminUser)).rejects.toThrow(ServiceUnavailableException);
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
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindServiceVariantByIdUseCase with id and user', async () => {
      const variant = { id: 'v1', price: 50.0, size: 'MEDIUM' };
      mockFindByIdUseCase.execute.mockResolvedValue(variant);

      const result = await service.findOne('v1', adminUser);

      expect(mockFindByIdUseCase.execute).toHaveBeenCalledWith('v1', adminUser);
      expect(result).toEqual(variant);
    });

    it('should propagate NotFoundException when variant not found', async () => {
      mockFindByIdUseCase.execute.mockRejectedValue(new NotFoundException('Service variant not found'));

      await expect(service.findOne('missing-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException from use case', async () => {
      mockFindByIdUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.findOne('v1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Security: cross-shop access ---
    it('should pass user context so use case can enforce shop scope', async () => {
      mockFindByIdUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.findOne('v1', employeeUser);

      expect(mockFindByIdUseCase.execute).toHaveBeenCalledWith('v1', employeeUser);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { price: 59.90, size: 'LARGE' as const };

    it('should delegate to UpdateServiceVariantUseCase with id, data and user', async () => {
      const updated = { id: 'v1', ...updateDto };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('v1', updateDto as any, adminUser);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('v1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when variant not found', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(new NotFoundException('Service variant not found'));

      await expect(service.update('missing', updateDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(new NotFoundException('Service not found'));

      await expect(service.update('v1', { serviceId: 'invalid-svc' } as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException when duplicate size exists', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(
        new ConflictException('Variant for this size already exists in this service'),
      );

      await expect(service.update('v1', updateDto as any, adminUser)).rejects.toThrow(ConflictException);
    });

    it('should propagate ServiceUnavailableException from use case', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.update('v1', updateDto as any, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Security: price manipulation on update ---
    describe('Security - price manipulation on update', () => {
      it('should forward negative price update to use case', async () => {
        const dto = { price: -50 };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'v1', price: -50 });

        await service.update('v1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('v1', dto, adminUser);
      });

      it('should forward NaN price update to use case', async () => {
        const dto = { price: NaN };
        mockUpdateUseCase.execute.mockResolvedValue({ id: 'v1', price: NaN });

        await service.update('v1', dto as any, adminUser);

        expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('v1', dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteServiceVariantUseCase with id and user', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('v1', adminUser);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('v1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate NotFoundException when variant not found', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(new NotFoundException('Service variant not found'));

      await expect(service.remove('missing', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException from use case', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.remove('v1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user for all authorized roles', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await service.remove('v1', user);
        expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('v1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // Security: cross-shop scope tests
  // -----------------------------------------------------------
  describe('Security - shop scope isolation', () => {
    it('should always pass user to create so use case can scope by shop', async () => {
      const dto = { price: 10, duration: 15, size: 'SMALL' as const, serviceId: 'svc-1' };
      mockCreateUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.create(dto as any, employeeUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, employeeUser);
      const [, passedUser] = mockCreateUseCase.execute.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
      expect(passedUser.role).toBe('EMPLOYEE');
    });

    it('should always pass user to findAll so use case can scope by shop', async () => {
      mockFindAllUseCase.execute.mockResolvedValue([]);

      await service.findAll({ shopId: 'shop-1' }, employeeUser);

      const [, passedUser] = mockFindAllUseCase.execute.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });

    it('should always pass user to findOne so use case can scope by shop', async () => {
      mockFindByIdUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.findOne('v1', employeeUser);

      const [, passedUser] = mockFindByIdUseCase.execute.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });

    it('should always pass user to update so use case can scope by shop', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.update('v1', { price: 10 } as any, employeeUser);

      const [, , passedUser] = mockUpdateUseCase.execute.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });

    it('should always pass user to remove so use case can scope by shop', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      await service.remove('v1', employeeUser);

      const [, passedUser] = mockDeleteUseCase.execute.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
    });
  });

  // -----------------------------------------------------------
  // Security: input validation (XSS / injection)
  // -----------------------------------------------------------
  describe('Security - input validation passthrough', () => {
    it('should forward serviceId with XSS payload to use case (DTO validation is responsible)', async () => {
      const dto = {
        price: 10,
        duration: 15,
        size: 'SMALL' as const,
        serviceId: '<script>alert("xss")</script>',
      };
      mockCreateUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.create(dto as any, adminUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
    });

    it('should forward serviceId with SQL injection payload to use case', async () => {
      const dto = {
        price: 10,
        duration: 15,
        size: 'SMALL' as const,
        serviceId: "'; DROP TABLE service_variants; --",
      };
      mockCreateUseCase.execute.mockResolvedValue({ id: 'v1' });

      await service.create(dto as any, adminUser);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, adminUser);
    });
  });
});
