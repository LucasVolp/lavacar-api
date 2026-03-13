import { Test, TestingModule } from '@nestjs/testing';
import { ServiceGroupController } from '../service-group.controller';
import { ServiceGroupService } from '../service-group.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

const mockServiceGroupService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ServiceGroupController', () => {
  let controller: ServiceGroupController;

  const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999999999', role: 'ADMIN' };
  const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511888888888', role: 'OWNER' };
  const managerUser: JwtPayload = { id: 'manager-1', email: 'manager@test.com', phone: '+5511777777777', role: 'MANAGER' };
  const employeeUser: JwtPayload = { id: 'employee-1', email: 'employee@test.com', phone: '+5511666666666', role: 'EMPLOYEE' };

  const mockShopId = '550e8400-e29b-41d4-a716-446655440000';
  const mockGroupId = '660e8400-e29b-41d4-a716-446655440000';

  const mockGroupResult = {
    id: mockGroupId,
    name: 'Lavagens',
    description: 'Grupo de servicos de lavagem',
    isActive: true,
    shopId: mockShopId,
    services: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceGroupController],
      providers: [
        { provide: ServiceGroupService, useValue: mockServiceGroupService },
      ],
    }).compile();

    controller = module.get<ServiceGroupController>(ServiceGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /service-groups
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      name: 'Lavagens',
      description: 'Grupo de servicos de lavagem',
      isActive: true,
      shopId: mockShopId,
    };

    it('should delegate to serviceGroupService.create with DTO and user', () => {
      mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

      const result = controller.create(createDto as any, adminUser);

      expect(mockServiceGroupService.create).toHaveBeenCalledWith(createDto, adminUser);
    });

    it('should forward the entire DTO to the service', () => {
      mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

      controller.create(createDto as any, ownerUser);

      expect(mockServiceGroupService.create).toHaveBeenCalledWith(createDto, ownerUser);
    });

    it('should propagate errors from serviceGroupService.create', async () => {
      mockServiceGroupService.create.mockRejectedValue(new Error('fail'));

      await expect(controller.create(createDto as any, adminUser)).rejects.toThrow('fail');
    });

    it('should pass different user roles to the service', () => {
      mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

      controller.create(createDto as any, employeeUser);

      expect(mockServiceGroupService.create).toHaveBeenCalledWith(createDto, employeeUser);
    });

    it('should create group with minimal required fields', () => {
      const minimalDto = { name: 'Test', shopId: mockShopId };
      mockServiceGroupService.create.mockResolvedValue({ ...mockGroupResult, name: 'Test' });

      controller.create(minimalDto as any, adminUser);

      expect(mockServiceGroupService.create).toHaveBeenCalledWith(minimalDto, adminUser);
    });
  });

  // -----------------------------------------------------------
  // GET /service-groups
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should pass parsed query params to serviceGroupService.findAll', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, mockShopId, '1', '10');

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        {
          shopId: mockShopId,
          page: 1,
          perPage: 10,
        },
        adminUser,
      );
    });

    it('should pass undefined for missing query params', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, undefined, undefined);

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        {
          shopId: undefined,
          page: undefined,
          perPage: undefined,
        },
        adminUser,
      );
    });

    it('should parse page and perPage as integers', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, '3', '25');

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, perPage: 25 }),
        adminUser,
      );
    });

    it('should propagate errors from serviceGroupService.findAll', async () => {
      mockServiceGroupService.findAll.mockRejectedValue(new Error('fail'));

      await expect(
        controller.findAll(adminUser, undefined, undefined, undefined),
      ).rejects.toThrow('fail');
    });

    it('should pass shopId filter to service', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(ownerUser, mockShopId, undefined, undefined);

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ shopId: mockShopId }),
        ownerUser,
      );
    });
  });

  // -----------------------------------------------------------
  // GET /service-groups/:id
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to serviceGroupService.findOne with id and user', () => {
      mockServiceGroupService.findOne.mockResolvedValue(mockGroupResult);

      const result = controller.findOne(mockGroupId, adminUser);

      expect(mockServiceGroupService.findOne).toHaveBeenCalledWith(mockGroupId, adminUser);
    });

    it('should propagate errors from serviceGroupService.findOne', async () => {
      mockServiceGroupService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('missing', adminUser)).rejects.toThrow('Not found');
    });

    it('should pass user context for scope enforcement', () => {
      mockServiceGroupService.findOne.mockResolvedValue(mockGroupResult);

      controller.findOne(mockGroupId, employeeUser);

      expect(mockServiceGroupService.findOne).toHaveBeenCalledWith(mockGroupId, employeeUser);
    });
  });

  // -----------------------------------------------------------
  // PATCH /service-groups/:id
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to serviceGroupService.update with id, DTO and user', () => {
      const updateDto = { name: 'Updated Group' };
      mockServiceGroupService.update.mockResolvedValue({ ...mockGroupResult, name: 'Updated Group' });

      const result = controller.update(mockGroupId, updateDto as any, adminUser);

      expect(mockServiceGroupService.update).toHaveBeenCalledWith(mockGroupId, updateDto, adminUser);
    });

    it('should propagate errors from serviceGroupService.update', async () => {
      mockServiceGroupService.update.mockRejectedValue(new Error('fail'));

      await expect(controller.update(mockGroupId, {} as any, adminUser)).rejects.toThrow('fail');
    });

    it('should pass partial update DTO', () => {
      const partialDto = { description: 'Updated description' };
      mockServiceGroupService.update.mockResolvedValue({ ...mockGroupResult, ...partialDto });

      controller.update(mockGroupId, partialDto as any, ownerUser);

      expect(mockServiceGroupService.update).toHaveBeenCalledWith(mockGroupId, partialDto, ownerUser);
    });

    it('should pass isActive update', () => {
      const statusDto = { isActive: false };
      mockServiceGroupService.update.mockResolvedValue({ ...mockGroupResult, isActive: false });

      controller.update(mockGroupId, statusDto as any, adminUser);

      expect(mockServiceGroupService.update).toHaveBeenCalledWith(mockGroupId, statusDto, adminUser);
    });
  });

  // -----------------------------------------------------------
  // DELETE /service-groups/:id
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to serviceGroupService.remove with id and user', () => {
      mockServiceGroupService.remove.mockResolvedValue({ message: 'Service group deleted successfully' });

      const result = controller.remove(mockGroupId, adminUser);

      expect(mockServiceGroupService.remove).toHaveBeenCalledWith(mockGroupId, adminUser);
    });

    it('should propagate errors from serviceGroupService.remove', async () => {
      mockServiceGroupService.remove.mockRejectedValue(new Error('fail'));

      await expect(controller.remove(mockGroupId, adminUser)).rejects.toThrow('fail');
    });

    it('should pass user context for deletion scope', () => {
      mockServiceGroupService.remove.mockResolvedValue({ message: 'deleted' });

      controller.remove(mockGroupId, ownerUser);

      expect(mockServiceGroupService.remove).toHaveBeenCalledWith(mockGroupId, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // Security tests
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('RBAC - Role-based access control', () => {
      it('should pass ADMIN user to create', () => {
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);
        const dto = { name: 'Test', shopId: mockShopId } as any;

        controller.create(dto, adminUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(dto, adminUser);
      });

      it('should pass OWNER user to create', () => {
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);
        const dto = { name: 'Test', shopId: mockShopId } as any;

        controller.create(dto, ownerUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(dto, ownerUser);
      });

      it('should pass MANAGER user to create', () => {
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);
        const dto = { name: 'Test', shopId: mockShopId } as any;

        controller.create(dto, managerUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(dto, managerUser);
      });

      it('should pass EMPLOYEE user to create', () => {
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);
        const dto = { name: 'Test', shopId: mockShopId } as any;

        controller.create(dto, employeeUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(dto, employeeUser);
      });

      it('should pass user context to findAll for scope enforcement', () => {
        mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

        controller.findAll(ownerUser, mockShopId);

        expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
          expect.any(Object),
          ownerUser,
        );
      });

      it('should pass user context to findOne for scope enforcement', () => {
        mockServiceGroupService.findOne.mockResolvedValue(mockGroupResult);

        controller.findOne(mockGroupId, employeeUser);

        expect(mockServiceGroupService.findOne).toHaveBeenCalledWith(mockGroupId, employeeUser);
      });

      it('should pass user context to update for scope enforcement', () => {
        mockServiceGroupService.update.mockResolvedValue(mockGroupResult);

        controller.update(mockGroupId, { name: 'Updated' } as any, managerUser);

        expect(mockServiceGroupService.update).toHaveBeenCalledWith(mockGroupId, { name: 'Updated' }, managerUser);
      });

      it('should pass user context to remove for scope enforcement', () => {
        mockServiceGroupService.remove.mockResolvedValue({ message: 'deleted' });

        controller.remove(mockGroupId, adminUser);

        expect(mockServiceGroupService.remove).toHaveBeenCalledWith(mockGroupId, adminUser);
      });
    });

    describe('Input validation at controller level', () => {
      it('should forward XSS-like name to service layer', () => {
        const xssDto = { name: '<script>alert("xss")</script>', shopId: mockShopId } as any;
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

        controller.create(xssDto, adminUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: '<script>alert("xss")</script>' }),
          adminUser,
        );
      });

      it('should forward very long name to service layer', () => {
        const longName = 'A'.repeat(10000);
        const dto = { name: longName, shopId: mockShopId } as any;
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

        controller.create(dto, adminUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: longName }),
          adminUser,
        );
      });

      it('should forward XSS-like description to service layer on update', () => {
        const xssDto = { description: '<img src=x onerror=alert(document.cookie)>' } as any;
        mockServiceGroupService.update.mockResolvedValue(mockGroupResult);

        controller.update(mockGroupId, xssDto, adminUser);

        expect(mockServiceGroupService.update).toHaveBeenCalledWith(
          mockGroupId,
          expect.objectContaining({ description: '<img src=x onerror=alert(document.cookie)>' }),
          adminUser,
        );
      });

      it('should forward SQL injection-like name to service layer', () => {
        const sqlDto = { name: "'; DROP TABLE service_groups; --", shopId: mockShopId } as any;
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

        controller.create(sqlDto, adminUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: "'; DROP TABLE service_groups; --" }),
          adminUser,
        );
      });
    });

    describe('Shop scope isolation', () => {
      it('should forward shopId in create DTO for scope enforcement', () => {
        const dto = { name: 'Test', shopId: mockShopId } as any;
        mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

        controller.create(dto, ownerUser);

        expect(mockServiceGroupService.create).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          ownerUser,
        );
      });

      it('should pass shopId filter in findAll for scope enforcement', () => {
        mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

        controller.findAll(employeeUser, mockShopId, '1', '10');

        expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ shopId: mockShopId }),
          employeeUser,
        );
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('findAll should handle NaN page gracefully', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, 'abc', undefined);

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: NaN }),
        adminUser,
      );
    });

    it('findAll should handle empty string page (becomes undefined)', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser, undefined, '', undefined);

      // Empty string is falsy, so parseInt won't be called, page becomes undefined
      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: undefined }),
        adminUser,
      );
    });

    it('create should return the promise from serviceGroupService.create', () => {
      mockServiceGroupService.create.mockResolvedValue(mockGroupResult);

      const result = controller.create({ name: 'Test', shopId: mockShopId } as any, adminUser);

      expect(result).toEqual(expect.any(Promise));
    });

    it('findAll should handle all params being undefined', () => {
      mockServiceGroupService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(adminUser);

      expect(mockServiceGroupService.findAll).toHaveBeenCalledWith(
        {
          shopId: undefined,
          page: undefined,
          perPage: undefined,
        },
        adminUser,
      );
    });
  });
});
