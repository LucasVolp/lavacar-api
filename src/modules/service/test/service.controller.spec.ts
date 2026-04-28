import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ServiceController } from '../service.controller';
import { ServiceService } from '../service.service';
import { StorageService } from '../../storage/storage.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { SubscriptionGuard } from 'src/guards/subscription.guard';

const mockServiceService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findPublicServices: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

describe('ServiceController', () => {
  let controller: ServiceController;

  const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
  const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
  const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
  const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };

  const mockShopId = '550e8400-e29b-41d4-a716-446655440000';
  const mockGroupId = '660e8400-e29b-41d4-a716-446655440000';
  const mockServiceId = '770e8400-e29b-41d4-a716-446655440000';

  const mockServiceResult = {
    id: mockServiceId,
    name: 'Lavagem Completa',
    description: 'Lavagem interna e externa',
    price: 89.90,
    duration: 60,
    isActive: true,
    shopId: mockShopId,
    groupId: mockGroupId,
    photoUrl: null,
    isBudgetOnly: false,
    hasVariants: false,
    shop: { id: mockShopId, name: 'Test Shop', organizationId: 'org-1' },
    group: { id: mockGroupId, name: 'Lavagens' },
    variants: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        { provide: ServiceService, useValue: mockServiceService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServiceController>(ServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /service
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      name: 'Lavagem Completa',
      description: 'Lavagem interna e externa',
      price: 89.90,
      duration: 60,
      shopId: mockShopId,
      groupId: mockGroupId,
    };

    it('should delegate to serviceService.create with DTO and user', () => {
      mockServiceService.create.mockResolvedValue(mockServiceResult);

      const result = controller.create(createDto as any, adminUser);

      expect(mockServiceService.create).toHaveBeenCalledWith(createDto, adminUser);
    });

    it('should forward the entire DTO to the service', () => {
      const fullDto = {
        ...createDto,
        isActive: true,
        isBudgetOnly: false,
        hasVariants: true,
        photoUrl: 'https://example.com/photo.webp',
      };
      mockServiceService.create.mockResolvedValue({ ...mockServiceResult, ...fullDto });

      controller.create(fullDto as any, ownerUser);

      expect(mockServiceService.create).toHaveBeenCalledWith(fullDto, ownerUser);
    });

    it('should propagate errors from serviceService.create', async () => {
      mockServiceService.create.mockRejectedValue(new Error('fail'));

      await expect(controller.create(createDto as any, adminUser)).rejects.toThrow('fail');
    });

    it('should pass different user roles to the service', () => {
      mockServiceService.create.mockResolvedValue(mockServiceResult);

      controller.create(createDto as any, employeeUser);

      expect(mockServiceService.create).toHaveBeenCalledWith(createDto, employeeUser);
    });
  });

  // -----------------------------------------------------------
  // GET /service
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should pass parsed query params to serviceService.findAll', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, mockShopId, mockGroupId, 'Lavagem', 'true', '1', '10');

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        {
          shopId: mockShopId,
          groupId: mockGroupId,
          search: 'Lavagem',
          isActive: true,
          page: 1,
          perPage: 10,
        },
        adminUser,
      );
    });

    it('should pass undefined for missing query params', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined, undefined, undefined, undefined);

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        {
          shopId: undefined,
          groupId: undefined,
          search: undefined,
          isActive: undefined,
          page: undefined,
          perPage: undefined,
        },
        adminUser,
      );
    });

    it('should parse isActive "true" as boolean true', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined, 'true', undefined, undefined);

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
        adminUser,
      );
    });

    it('should parse isActive "false" as boolean false', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined, 'false', undefined, undefined);

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
        adminUser,
      );
    });

    it('should parse page and perPage as integers', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined, undefined, '3', '25');

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, perPage: 25 }),
        adminUser,
      );
    });

    it('should propagate errors from serviceService.findAll', async () => {
      mockServiceService.findAll.mockRejectedValue(new Error('fail'));

      await expect(
        controller.findAll(adminUser, undefined, undefined, undefined, undefined, undefined, undefined),
      ).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // GET /service/public
  // -----------------------------------------------------------
  describe('findPublicServices', () => {
    it('should delegate to serviceService.findPublicServices with filters', () => {
      mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findPublicServices(mockShopId, mockGroupId, 'Lavagem', '1', '10');

      expect(mockServiceService.findPublicServices).toHaveBeenCalledWith({
        shopId: mockShopId,
        groupId: mockGroupId,
        search: 'Lavagem',
        isActive: true,
        page: 1,
        perPage: 10,
      });
    });

    it('should always set isActive to true for public endpoint', () => {
      mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findPublicServices(mockShopId);

      expect(mockServiceService.findPublicServices).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });

    it('should NOT pass user context (public endpoint)', () => {
      mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findPublicServices(mockShopId);

      expect(mockServiceService.findPublicServices).toHaveBeenCalledWith(
        expect.objectContaining({ shopId: mockShopId }),
      );
      // Verify only one argument (no user)
      expect(mockServiceService.findPublicServices.mock.calls[0]).toHaveLength(1);
    });

    it('should handle optional query params', () => {
      mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findPublicServices(mockShopId, undefined, undefined, undefined, undefined);

      expect(mockServiceService.findPublicServices).toHaveBeenCalledWith({
        shopId: mockShopId,
        groupId: undefined,
        search: undefined,
        isActive: true,
        page: undefined,
        perPage: undefined,
      });
    });

    it('should propagate errors from findPublicServices', async () => {
      mockServiceService.findPublicServices.mockRejectedValue(new Error('fail'));

      await expect(controller.findPublicServices(mockShopId)).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // GET /service/:id
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to serviceService.findOne with id and user', () => {
      mockServiceService.findOne.mockResolvedValue(mockServiceResult);

      const result = controller.findOne(mockServiceId, adminUser);

      expect(mockServiceService.findOne).toHaveBeenCalledWith(mockServiceId, adminUser);
    });

    it('should propagate errors from serviceService.findOne', async () => {
      mockServiceService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('missing', adminUser)).rejects.toThrow('Not found');
    });
  });

  // -----------------------------------------------------------
  // PATCH /service/:id
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to serviceService.update with id, DTO and user', () => {
      const updateDto = { name: 'Updated Service' };
      mockServiceService.update.mockResolvedValue({ ...mockServiceResult, name: 'Updated Service' });

      const result = controller.update(mockServiceId, updateDto as any, adminUser);

      expect(mockServiceService.update).toHaveBeenCalledWith(mockServiceId, updateDto, adminUser);
    });

    it('should propagate errors from serviceService.update', async () => {
      mockServiceService.update.mockRejectedValue(new Error('fail'));

      await expect(controller.update(mockServiceId, {} as any, adminUser)).rejects.toThrow('fail');
    });

    it('should pass partial update DTO', () => {
      const partialDto = { price: 150.00 };
      mockServiceService.update.mockResolvedValue({ ...mockServiceResult, price: 150.00 });

      controller.update(mockServiceId, partialDto as any, ownerUser);

      expect(mockServiceService.update).toHaveBeenCalledWith(mockServiceId, partialDto, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // POST /service/:id/upload/photo
  // -----------------------------------------------------------
  describe('uploadPhoto', () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/png',
      originalname: 'photo.png',
      size: 1024,
    } as Express.Multer.File;

    const serviceWithPhoto = {
      ...mockServiceResult,
      shop: { ...mockServiceResult.shop, organizationId: 'org-1' },
    };

    it('should upload photo and update service photoUrl', async () => {
      mockServiceService.findOne.mockResolvedValue(serviceWithPhoto);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo.webp');
      mockServiceService.update.mockResolvedValue({});

      const result = await controller.uploadPhoto(mockServiceId, mockFile, adminUser);

      expect(mockServiceService.findOne).toHaveBeenCalledWith(mockServiceId, adminUser);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        fileType: 'IMAGE',
        context: {
          type: 'SERVICE',
          organizationId: 'org-1',
          shopId: mockShopId,
          serviceId: mockServiceId,
          category: 'cover',
        },
      });
      expect(mockServiceService.update).toHaveBeenCalledWith(
        mockServiceId,
        { photoUrl: 'https://cdn.example.com/photo.webp' },
        adminUser,
      );
      expect(result).toEqual({ url: 'https://cdn.example.com/photo.webp' });
    });

    it('should delete old photo before uploading new one', async () => {
      const serviceWithExistingPhoto = { ...serviceWithPhoto, photoUrl: 'https://cdn.example.com/old.webp' };
      mockServiceService.findOne.mockResolvedValue(serviceWithExistingPhoto);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new.webp');
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockServiceService.update.mockResolvedValue({});

      await controller.uploadPhoto(mockServiceId, mockFile, adminUser);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/old.webp');
    });

    it('should not fail if old photo deletion fails (graceful)', async () => {
      const serviceWithExistingPhoto = { ...serviceWithPhoto, photoUrl: 'https://cdn.example.com/old.webp' };
      mockServiceService.findOne.mockResolvedValue(serviceWithExistingPhoto);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new.webp');
      mockStorageService.deleteFile.mockRejectedValue(new Error('storage error'));
      mockServiceService.update.mockResolvedValue({});

      // Should not throw because the controller catches the error
      const result = await controller.uploadPhoto(mockServiceId, mockFile, adminUser);

      expect(result).toEqual({ url: 'https://cdn.example.com/new.webp' });
    });

    it('should skip deleting old photo when none exists', async () => {
      mockServiceService.findOne.mockResolvedValue({ ...serviceWithPhoto, photoUrl: null });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo.webp');
      mockServiceService.update.mockResolvedValue({});

      await controller.uploadPhoto(mockServiceId, mockFile, adminUser);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(
        controller.uploadPhoto(mockServiceId, undefined as any, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with correct message when no file', async () => {
      await expect(
        controller.uploadPhoto(mockServiceId, null as any, adminUser),
      ).rejects.toThrow('Arquivo nao enviado');
    });

    it('should use correct storage context for SERVICE type', async () => {
      mockServiceService.findOne.mockResolvedValue(serviceWithPhoto);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo.webp');
      mockServiceService.update.mockResolvedValue({});

      await controller.uploadPhoto(mockServiceId, mockFile, adminUser);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            type: 'SERVICE',
            category: 'cover',
          }),
        }),
      );
    });
  });

  // -----------------------------------------------------------
  // DELETE /service/:id/upload/photo
  // -----------------------------------------------------------
  describe('deletePhoto', () => {
    it('should delete photo file and update service with null photoUrl', async () => {
      const serviceWithExistingPhoto = { ...mockServiceResult, photoUrl: 'https://cdn.example.com/photo.webp' };
      mockServiceService.findOne.mockResolvedValue(serviceWithExistingPhoto);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockServiceService.update.mockResolvedValue({});

      const result = await controller.deletePhoto(mockServiceId, adminUser);

      expect(mockServiceService.findOne).toHaveBeenCalledWith(mockServiceId, adminUser);
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/photo.webp');
      expect(mockServiceService.update).toHaveBeenCalledWith(
        mockServiceId,
        { photoUrl: null },
        adminUser,
      );
      expect(result).toEqual({ success: true });
    });

    it('should skip storage delete if no photo exists', async () => {
      mockServiceService.findOne.mockResolvedValue({ ...mockServiceResult, photoUrl: null });
      mockServiceService.update.mockResolvedValue({});

      const result = await controller.deletePhoto(mockServiceId, adminUser);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should still update photoUrl to null even if no photo exists', async () => {
      mockServiceService.findOne.mockResolvedValue({ ...mockServiceResult, photoUrl: null });
      mockServiceService.update.mockResolvedValue({});

      await controller.deletePhoto(mockServiceId, adminUser);

      expect(mockServiceService.update).toHaveBeenCalledWith(
        mockServiceId,
        { photoUrl: null },
        adminUser,
      );
    });

    it('should propagate errors from storage deleteFile', async () => {
      mockServiceService.findOne.mockResolvedValue({ ...mockServiceResult, photoUrl: 'https://cdn.example.com/photo.webp' });
      mockStorageService.deleteFile.mockRejectedValue(new Error('Storage error'));

      await expect(controller.deletePhoto(mockServiceId, adminUser)).rejects.toThrow('Storage error');
    });
  });

  // -----------------------------------------------------------
  // DELETE /service/:id
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to serviceService.remove with id and user', () => {
      mockServiceService.remove.mockResolvedValue(mockServiceResult);

      const result = controller.remove(mockServiceId, adminUser);

      expect(mockServiceService.remove).toHaveBeenCalledWith(mockServiceId, adminUser);
    });

    it('should propagate errors from serviceService.remove', async () => {
      mockServiceService.remove.mockRejectedValue(new Error('fail'));

      await expect(controller.remove(mockServiceId, adminUser)).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // Security tests
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('RBAC - Role-based access control', () => {
      it('should pass ADMIN user to create', () => {
        mockServiceService.create.mockResolvedValue(mockServiceResult);
        const dto = { name: 'Test', price: 10, duration: 30, shopId: mockShopId } as any;

        controller.create(dto, adminUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should pass OWNER user to create', () => {
        mockServiceService.create.mockResolvedValue(mockServiceResult);
        const dto = { name: 'Test', price: 10, duration: 30, shopId: mockShopId } as any;

        controller.create(dto, ownerUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(dto, ownerUser);
      });

      it('should pass MANAGER user to create', () => {
        mockServiceService.create.mockResolvedValue(mockServiceResult);
        const dto = { name: 'Test', price: 10, duration: 30, shopId: mockShopId } as any;

        controller.create(dto, managerUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(dto, managerUser);
      });

      it('should pass EMPLOYEE user to create', () => {
        mockServiceService.create.mockResolvedValue(mockServiceResult);
        const dto = { name: 'Test', price: 10, duration: 30, shopId: mockShopId } as any;

        controller.create(dto, employeeUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(dto, employeeUser);
      });

      it('should pass user context to findAll for scope enforcement', () => {
        mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

        controller.findAll(ownerUser, mockShopId);

        expect(mockServiceService.findAll).toHaveBeenCalledWith(
          expect.any(Object),
          ownerUser,
        );
      });

      it('should pass user context to findOne for scope enforcement', () => {
        mockServiceService.findOne.mockResolvedValue(mockServiceResult);

        controller.findOne(mockServiceId, employeeUser);

        expect(mockServiceService.findOne).toHaveBeenCalledWith(mockServiceId, employeeUser);
      });

      it('should pass user context to update for scope enforcement', () => {
        mockServiceService.update.mockResolvedValue(mockServiceResult);

        controller.update(mockServiceId, { name: 'Updated' } as any, managerUser);

        expect(mockServiceService.update).toHaveBeenCalledWith(mockServiceId, { name: 'Updated' }, managerUser);
      });

      it('should pass user context to remove for scope enforcement', () => {
        mockServiceService.remove.mockResolvedValue(mockServiceResult);

        controller.remove(mockServiceId, adminUser);

        expect(mockServiceService.remove).toHaveBeenCalledWith(mockServiceId, adminUser);
      });
    });

    describe('Input validation at controller level', () => {
      it('should forward XSS-like name to service layer', () => {
        const xssDto = { name: '<script>alert("xss")</script>', price: 10, duration: 30, shopId: mockShopId } as any;
        mockServiceService.create.mockResolvedValue(mockServiceResult);

        controller.create(xssDto, adminUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: '<script>alert("xss")</script>' }),
          adminUser,
        );
      });

      it('should forward very long name to service layer', () => {
        const longName = 'A'.repeat(10000);
        const dto = { name: longName, price: 10, duration: 30, shopId: mockShopId } as any;
        mockServiceService.create.mockResolvedValue(mockServiceResult);

        controller.create(dto, adminUser);

        expect(mockServiceService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: longName }),
          adminUser,
        );
      });
    });

    describe('Public endpoint security', () => {
      it('findPublicServices should not include user authentication', () => {
        mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

        controller.findPublicServices(mockShopId);

        // Verify the public method is called, not the authenticated one
        expect(mockServiceService.findPublicServices).toHaveBeenCalled();
        expect(mockServiceService.findAll).not.toHaveBeenCalled();
      });

      it('findPublicServices should force isActive to true', () => {
        mockServiceService.findPublicServices.mockResolvedValue({ data: [], meta: { total: 0 } });

        controller.findPublicServices(mockShopId);

        expect(mockServiceService.findPublicServices).toHaveBeenCalledWith(
          expect.objectContaining({ isActive: true }),
        );
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('findAll should handle NaN page gracefully (parseInt returns NaN)', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined, undefined, 'abc', undefined);

      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: NaN }),
        adminUser,
      );
    });

    it('findAll should handle empty string page (becomes undefined since parseInt of empty is NaN)', () => {
      mockServiceService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      // Empty string is truthy for ternary but parseInt returns NaN
      controller.findAll(adminUser, undefined, undefined, undefined, undefined, '', undefined);

      // page is '' which is falsy, so parseInt won't be called, result is undefined
      expect(mockServiceService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: undefined }),
        adminUser,
      );
    });

    it('create should return the promise from serviceService.create', () => {
      const resolvedService = { id: 'new-service' };
      mockServiceService.create.mockResolvedValue(resolvedService);

      const result = controller.create({ name: 'Test' } as any, adminUser);

      expect(result).toEqual(expect.any(Promise));
    });
  });
});
