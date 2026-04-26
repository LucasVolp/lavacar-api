import { Test, TestingModule } from '@nestjs/testing';
import { ServiceVariantController } from '../service-variant.controller';
import { ServiceVariantService } from '../service-variant.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

const mockServiceVariantService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };

describe('ServiceVariantController', () => {
  let controller: ServiceVariantController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceVariantController],
      providers: [
        { provide: ServiceVariantService, useValue: mockServiceVariantService },
      ],
    }).compile();

    controller = module.get<ServiceVariantController>(ServiceVariantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /service-variants
  // -----------------------------------------------------------
  describe('create', () => {
    const validDto = {
      price: 49.90,
      duration: 30,
      size: 'SMALL' as const,
      serviceId: 'service-uuid-1',
    };

    it('should delegate to service.create with dto and user', () => {
      const created = { id: 'v1', ...validDto };
      mockServiceVariantService.create.mockResolvedValue(created);

      const result = controller.create(validDto as any, adminUser);

      expect(mockServiceVariantService.create).toHaveBeenCalledWith(validDto, adminUser);
    });

    it('should return the created variant', async () => {
      const created = { id: 'v1', ...validDto };
      mockServiceVariantService.create.mockResolvedValue(created);

      const result = await controller.create(validDto as any, adminUser);

      expect(result).toEqual(created);
    });

    it('should propagate NotFoundException from service', async () => {
      mockServiceVariantService.create.mockRejectedValue(new NotFoundException('Service not found'));

      await expect(controller.create(validDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException from service', async () => {
      mockServiceVariantService.create.mockRejectedValue(
        new ConflictException('Variant for this size already exists in this service'),
      );

      await expect(controller.create(validDto as any, adminUser)).rejects.toThrow(ConflictException);
    });

    it('should propagate ServiceUnavailableException from service', async () => {
      mockServiceVariantService.create.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.create(validDto as any, adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass through all authorized roles', async () => {
      mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await controller.create(validDto as any, user);
        expect(mockServiceVariantService.create).toHaveBeenCalledWith(validDto, user);
      }
    });

    // --- Security: price manipulation ---
    describe('Security - price manipulation', () => {
      it('should forward negative price to service (DTO pipe validation is responsible)', async () => {
        const dto = { ...validDto, price: -100 };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1', ...dto });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward NaN price to service', async () => {
        const dto = { ...validDto, price: NaN };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward Infinity price to service', async () => {
        const dto = { ...validDto, price: Infinity };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward MAX_SAFE_INTEGER price to service', async () => {
        const dto = { ...validDto, price: Number.MAX_SAFE_INTEGER };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: VehicleSize validation ---
    describe('Security - VehicleSize validation', () => {
      it('should forward invalid size enum value to service (DTO pipe validation is responsible)', async () => {
        const dto = { ...validDto, size: 'INVALID_SIZE' };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should forward numeric size value to service', async () => {
        const dto = { ...validDto, size: 99999 };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });

    // --- Security: XSS / injection in serviceId ---
    describe('Security - injection in fields', () => {
      it('should forward XSS in serviceId to service (ParseUUIDPipe not on body)', async () => {
        const dto = { ...validDto, serviceId: '<script>alert("xss")</script>' };
        mockServiceVariantService.create.mockResolvedValue({ id: 'v1' });

        await controller.create(dto as any, adminUser);

        expect(mockServiceVariantService.create).toHaveBeenCalledWith(dto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // GET /service-variants
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should pass parsed query params to service.findAll', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, 'svc-1', 'shop-1', '1', '10');

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: 'svc-1', shopId: 'shop-1', page: 1, perPage: 10 },
        adminUser,
      );
    });

    it('should handle undefined query params', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined, undefined, undefined);

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: undefined, shopId: undefined, page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should parse page as integer', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined, '3', '25');

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: undefined, shopId: undefined, page: 3, perPage: 25 },
        adminUser,
      );
    });

    it('should return the list of variants from service', async () => {
      const variants = [{ id: 'v1' }, { id: 'v2' }];
      mockServiceVariantService.findAll.mockResolvedValue(variants);

      const result = await controller.findAll(adminUser, undefined, undefined, undefined, undefined);

      expect(result).toEqual(variants);
    });

    it('should propagate errors from service.findAll', async () => {
      mockServiceVariantService.findAll.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(
        controller.findAll(adminUser, undefined, undefined, undefined, undefined),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Security: shop scope ---
    it('should always pass user context so service can enforce shop scope', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(employeeUser, undefined, 'other-shop-id', undefined, undefined);

      const [, passedUser] = mockServiceVariantService.findAll.mock.calls[0];
      expect(passedUser.id).toBe('employee-1');
      expect(passedUser.role).toBe('EMPLOYEE');
    });

    // --- Edge case: non-numeric page/perPage ---
    it('should result in NaN for non-numeric page string', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined, 'abc', 'xyz');

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: undefined, shopId: undefined, page: NaN, perPage: NaN },
        adminUser,
      );
    });
  });

  // -----------------------------------------------------------
  // GET /service-variants/:id
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to service.findOne with id and user', async () => {
      const variant = { id: 'v1', price: 50.0, size: 'MEDIUM' };
      mockServiceVariantService.findOne.mockResolvedValue(variant);

      const result = await controller.findOne('v1', adminUser);

      expect(mockServiceVariantService.findOne).toHaveBeenCalledWith('v1', adminUser);
      expect(result).toEqual(variant);
    });

    it('should propagate NotFoundException', async () => {
      mockServiceVariantService.findOne.mockRejectedValue(
        new NotFoundException('Service variant not found'),
      );

      await expect(controller.findOne('missing', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException', async () => {
      mockServiceVariantService.findOne.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.findOne('v1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    // --- Security: id parameter is validated by ParseUUIDPipe in real runtime ---
    it('should pass user context for shop scope enforcement', async () => {
      mockServiceVariantService.findOne.mockResolvedValue({ id: 'v1' });

      await controller.findOne('v1', employeeUser);

      expect(mockServiceVariantService.findOne).toHaveBeenCalledWith('v1', employeeUser);
    });
  });

  // -----------------------------------------------------------
  // PATCH /service-variants/:id
  // -----------------------------------------------------------
  describe('update', () => {
    const updateDto = { price: 59.90 };

    it('should delegate to service.update with id, dto and user', async () => {
      const updated = { id: 'v1', price: 59.90 };
      mockServiceVariantService.update.mockResolvedValue(updated);

      const result = await controller.update('v1', updateDto as any, adminUser);

      expect(mockServiceVariantService.update).toHaveBeenCalledWith('v1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when variant not found', async () => {
      mockServiceVariantService.update.mockRejectedValue(
        new NotFoundException('Service variant not found'),
      );

      await expect(controller.update('missing', updateDto as any, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServiceVariantService.update.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.update('v1', { serviceId: 'bad-svc' } as any, adminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException for duplicate size', async () => {
      mockServiceVariantService.update.mockRejectedValue(
        new ConflictException('Variant for this size already exists in this service'),
      );

      await expect(
        controller.update('v1', { size: 'LARGE' } as any, adminUser),
      ).rejects.toThrow(ConflictException);
    });

    // --- Security: price manipulation on update ---
    it('should forward negative price update through to service', async () => {
      const dto = { price: -999 };
      mockServiceVariantService.update.mockResolvedValue({ id: 'v1', price: -999 });

      await controller.update('v1', dto as any, adminUser);

      expect(mockServiceVariantService.update).toHaveBeenCalledWith('v1', dto, adminUser);
    });

    it('should forward zero duration update through to service', async () => {
      const dto = { duration: 0 };
      mockServiceVariantService.update.mockResolvedValue({ id: 'v1', duration: 0 });

      await controller.update('v1', dto as any, adminUser);

      expect(mockServiceVariantService.update).toHaveBeenCalledWith('v1', dto, adminUser);
    });
  });

  // -----------------------------------------------------------
  // DELETE /service-variants/:id
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to service.remove with id and user', async () => {
      mockServiceVariantService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('v1', adminUser);

      expect(mockServiceVariantService.remove).toHaveBeenCalledWith('v1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate NotFoundException', async () => {
      mockServiceVariantService.remove.mockRejectedValue(
        new NotFoundException('Service variant not found'),
      );

      await expect(controller.remove('missing', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException', async () => {
      mockServiceVariantService.remove.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(controller.remove('v1', adminUser)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should pass user context for all roles', async () => {
      mockServiceVariantService.remove.mockResolvedValue({ deleted: true });

      for (const user of [adminUser, ownerUser, managerUser, employeeUser]) {
        await controller.remove('v1', user);
        expect(mockServiceVariantService.remove).toHaveBeenCalledWith('v1', user);
      }
    });
  });

  // -----------------------------------------------------------
  // RBAC: @Roles decorator tests
  // -----------------------------------------------------------
  describe('RBAC - Roles decorator', () => {
    it('should have Roles decorator on the controller class', () => {
      const roles = Reflect.getMetadata('roles', ServiceVariantController);
      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('OWNER');
      expect(roles).toContain('EMPLOYEE');
      expect(roles).toContain('MANAGER');
    });

    it('should NOT include USER role in controller decorator', () => {
      const roles = Reflect.getMetadata('roles', ServiceVariantController);
      expect(roles).not.toContain('USER');
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('create should forward entire DTO unchanged to service', async () => {
      const fullDto = {
        price: 150.50,
        duration: 90,
        size: 'LARGE',
        serviceId: 'svc-uuid-123',
      };
      mockServiceVariantService.create.mockResolvedValue({ id: 'v1', ...fullDto });

      await controller.create(fullDto as any, adminUser);

      expect(mockServiceVariantService.create).toHaveBeenCalledWith(fullDto, adminUser);
    });

    it('findAll should handle only page without perPage', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined, '2', undefined);

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: undefined, shopId: undefined, page: 2, perPage: undefined },
        adminUser,
      );
    });

    it('findAll should handle only perPage without page', async () => {
      mockServiceVariantService.findAll.mockResolvedValue([]);

      await controller.findAll(adminUser, undefined, undefined, undefined, '50');

      expect(mockServiceVariantService.findAll).toHaveBeenCalledWith(
        { serviceId: undefined, shopId: undefined, page: undefined, perPage: 50 },
        adminUser,
      );
    });

    it('update with empty dto should still delegate to service', async () => {
      mockServiceVariantService.update.mockResolvedValue({ id: 'v1' });

      await controller.update('v1', {} as any, adminUser);

      expect(mockServiceVariantService.update).toHaveBeenCalledWith('v1', {}, adminUser);
    });
  });
});
