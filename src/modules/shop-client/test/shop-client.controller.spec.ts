import { Test, TestingModule } from '@nestjs/testing';
import { ShopClientController } from '../shop-client.controller';
import { ShopClientService } from '../shop-client.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateShopClientDto } from '../dto/create-shop-client.dto';
import { UpdateShopClientDto } from '../dto/update-shop-client.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockShopClientService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByShopId: jest.fn(),
  findByShopAndUser: jest.fn(),
  countByShopId: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511900000000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511900000001', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'mgr@test.com', phone: '+5511900000002', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511900000003', role: 'EMPLOYEE' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511900000004', role: 'USER' };

const sampleShopClient = {
  id: 'sc-1',
  shopId: 'shop-1',
  userId: 'user-1',
  customName: 'John Doe',
  customPhone: '+5511988887777',
  customEmail: 'john@test.com',
  notes: 'VIP client',
};

describe('ShopClientController', () => {
  let controller: ShopClientController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopClientController],
      providers: [
        { provide: ShopClientService, useValue: mockShopClientService },
      ],
    }).compile();

    controller = module.get<ShopClientController>(ShopClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =======================================================================
  // POST /shop-clients  (create)
  // =======================================================================
  describe('create', () => {
    const createDto: CreateShopClientDto = {
      shopId: 'shop-1',
      userId: 'user-1',
      customName: 'John Doe',
    };

    it('should delegate to shopClientService.create with dto and user', async () => {
      mockShopClientService.create.mockResolvedValue(sampleShopClient);

      const result = await controller.create(createDto, adminUser);

      expect(mockShopClientService.create).toHaveBeenCalledWith(createDto, adminUser);
      expect(result).toEqual(sampleShopClient);
    });

    it('should propagate errors from shopClientService.create', async () => {
      mockShopClientService.create.mockRejectedValue(new Error('Shop not found'));

      await expect(controller.create(createDto, adminUser)).rejects.toThrow('Shop not found');
    });

    it('should forward user context for authorization', async () => {
      mockShopClientService.create.mockResolvedValue(sampleShopClient);

      await controller.create(createDto, ownerUser);

      expect(mockShopClientService.create).toHaveBeenCalledWith(createDto, ownerUser);
    });

    it('should forward all DTO fields including optional ones', async () => {
      const fullDto: CreateShopClientDto = {
        shopId: 'shop-2',
        userId: 'user-2',
        customName: 'Jane Smith',
        customPhone: '+5511977776666',
        customEmail: 'jane@test.com',
        notes: 'Regular customer',
      };
      mockShopClientService.create.mockResolvedValue({ id: 'sc-2', ...fullDto });

      await controller.create(fullDto, adminUser);

      expect(mockShopClientService.create).toHaveBeenCalledWith(fullDto, adminUser);
    });
  });

  // =======================================================================
  // GET /shop-clients  (findAll)
  // =======================================================================
  describe('findAll', () => {
    it('should pass parsed query params and user to shopClientService.findAll', async () => {
      const paginatedResult = { data: [sampleShopClient], meta: { total: 1 } };
      mockShopClientService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(adminUser, '1', '10', 'John');

      expect(mockShopClientService.findAll).toHaveBeenCalledWith(
        { page: 1, perPage: 10, search: 'John' },
        adminUser,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should pass undefined for missing query params', async () => {
      mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(adminUser, undefined, undefined, undefined);

      expect(mockShopClientService.findAll).toHaveBeenCalledWith(
        { page: undefined, perPage: undefined, search: undefined },
        adminUser,
      );
    });

    it('should correctly parse integer strings', async () => {
      mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(adminUser, '3', '25', undefined);

      expect(mockShopClientService.findAll).toHaveBeenCalledWith(
        { page: 3, perPage: 25, search: undefined },
        adminUser,
      );
    });

    it('should result in NaN for non-numeric page strings', async () => {
      mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(adminUser, 'abc', 'xyz', undefined);

      expect(mockShopClientService.findAll).toHaveBeenCalledWith(
        { page: NaN, perPage: NaN, search: undefined },
        adminUser,
      );
    });

    it('should propagate errors from shopClientService.findAll', async () => {
      mockShopClientService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll(adminUser)).rejects.toThrow('DB error');
    });
  });

  // =======================================================================
  // GET /shop-clients/shop/:shopId  (findByShopId)
  // =======================================================================
  describe('findByShopId', () => {
    it('should pass shopId, parsed filters, and user to service', async () => {
      const paginatedResult = { data: [sampleShopClient], meta: { total: 1 } };
      mockShopClientService.findByShopId.mockResolvedValue(paginatedResult);

      const result = await controller.findByShopId(adminUser, 'shop-1', '1', '10', 'John');

      expect(mockShopClientService.findByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: 1, perPage: 10, search: 'John' },
        adminUser,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should pass undefined for missing query params', async () => {
      mockShopClientService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findByShopId(adminUser, 'shop-1', undefined, undefined, undefined);

      expect(mockShopClientService.findByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: undefined, perPage: undefined, search: undefined },
        adminUser,
      );
    });

    it('should propagate errors from service', async () => {
      mockShopClientService.findByShopId.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.findByShopId(employeeUser, 'other-shop')).rejects.toThrow('Forbidden');
    });
  });

  // =======================================================================
  // GET /shop-clients/shop-and-user  (findByShopAndUser) -- Public endpoint
  // =======================================================================
  describe('findByShopAndUser', () => {
    it('should delegate to shopClientService.findByShopAndUser with query params', async () => {
      mockShopClientService.findByShopAndUser.mockResolvedValue(sampleShopClient);

      const result = await controller.findByShopAndUser('shop-1', 'user-1');

      expect(mockShopClientService.findByShopAndUser).toHaveBeenCalledWith('shop-1', 'user-1');
      expect(result).toEqual(sampleShopClient);
    });

    it('should propagate NotFoundException from service', async () => {
      mockShopClientService.findByShopAndUser.mockRejectedValue(new Error('Shop client relationship not found'));

      await expect(controller.findByShopAndUser('shop-1', 'unknown-user')).rejects.toThrow(
        'Shop client relationship not found',
      );
    });

    it('should propagate BadRequestException for missing params', async () => {
      mockShopClientService.findByShopAndUser.mockRejectedValue(
        new Error('Shop ID and User ID must be provided'),
      );

      await expect(controller.findByShopAndUser('', '')).rejects.toThrow(
        'Shop ID and User ID must be provided',
      );
    });
  });

  // =======================================================================
  // GET /shop-clients/shop/:shopId/count  (countByShopId)
  // =======================================================================
  describe('countByShopId', () => {
    it('should delegate to shopClientService.countByShopId with shopId and user', async () => {
      mockShopClientService.countByShopId.mockResolvedValue(42);

      const result = await controller.countByShopId('shop-1', adminUser);

      expect(mockShopClientService.countByShopId).toHaveBeenCalledWith('shop-1', adminUser);
      expect(result).toBe(42);
    });

    it('should return 0 when no clients exist', async () => {
      mockShopClientService.countByShopId.mockResolvedValue(0);

      const result = await controller.countByShopId('empty-shop', adminUser);

      expect(result).toBe(0);
    });

    it('should pass user context for authorization', async () => {
      mockShopClientService.countByShopId.mockResolvedValue(5);

      await controller.countByShopId('shop-1', ownerUser);

      expect(mockShopClientService.countByShopId).toHaveBeenCalledWith('shop-1', ownerUser);
    });

    it('should propagate errors from service', async () => {
      mockShopClientService.countByShopId.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.countByShopId('shop-1', regularUser)).rejects.toThrow('Forbidden');
    });
  });

  // =======================================================================
  // GET /shop-clients/:id  (findOne)
  // =======================================================================
  describe('findOne', () => {
    it('should delegate to shopClientService.findOne with id and user', async () => {
      mockShopClientService.findOne.mockResolvedValue(sampleShopClient);

      const result = await controller.findOne('sc-1', adminUser);

      expect(mockShopClientService.findOne).toHaveBeenCalledWith('sc-1', adminUser);
      expect(result).toEqual(sampleShopClient);
    });

    it('should propagate NotFoundException', async () => {
      mockShopClientService.findOne.mockRejectedValue(new Error('Shop client not found'));

      await expect(controller.findOne('nonexistent', adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should forward user context for access control', async () => {
      mockShopClientService.findOne.mockResolvedValue(sampleShopClient);

      await controller.findOne('sc-1', employeeUser);

      expect(mockShopClientService.findOne).toHaveBeenCalledWith('sc-1', employeeUser);
    });
  });

  // =======================================================================
  // PATCH /shop-clients/:id  (update)
  // =======================================================================
  describe('update', () => {
    const updateDto: UpdateShopClientDto = { customName: 'Updated Name' };

    it('should delegate to shopClientService.update with id, dto, and user', async () => {
      const updated = { ...sampleShopClient, customName: 'Updated Name' };
      mockShopClientService.update.mockResolvedValue(updated);

      const result = await controller.update('sc-1', updateDto, adminUser);

      expect(mockShopClientService.update).toHaveBeenCalledWith('sc-1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException', async () => {
      mockShopClientService.update.mockRejectedValue(new Error('Shop client not found'));

      await expect(controller.update('nonexistent', updateDto, adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should forward user context for access control', async () => {
      mockShopClientService.update.mockResolvedValue(sampleShopClient);

      await controller.update('sc-1', updateDto, managerUser);

      expect(mockShopClientService.update).toHaveBeenCalledWith('sc-1', updateDto, managerUser);
    });

    it('should pass all optional update fields', async () => {
      const fullUpdate: UpdateShopClientDto = {
        customName: 'New Name',
        customPhone: '+5511966665555',
        customEmail: 'new@test.com',
        notes: 'Updated notes',
      };
      mockShopClientService.update.mockResolvedValue({ id: 'sc-1', ...fullUpdate });

      await controller.update('sc-1', fullUpdate, adminUser);

      expect(mockShopClientService.update).toHaveBeenCalledWith('sc-1', fullUpdate, adminUser);
    });
  });

  // =======================================================================
  // DELETE /shop-clients/:id  (remove)
  // =======================================================================
  describe('remove', () => {
    it('should delegate to shopClientService.remove with id and user', async () => {
      mockShopClientService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('sc-1', adminUser);

      expect(mockShopClientService.remove).toHaveBeenCalledWith('sc-1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate NotFoundException', async () => {
      mockShopClientService.remove.mockRejectedValue(new Error('Shop client not found'));

      await expect(controller.remove('nonexistent', adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should forward user context for authorization', async () => {
      mockShopClientService.remove.mockResolvedValue({ deleted: true });

      await controller.remove('sc-1', ownerUser);

      expect(mockShopClientService.remove).toHaveBeenCalledWith('sc-1', ownerUser);
    });
  });

  // =======================================================================
  // Security Tests
  // =======================================================================
  describe('Security', () => {
    describe('Multi-tenant isolation via user context', () => {
      it('every authenticated endpoint forwards user for scope enforcement', async () => {
        mockShopClientService.create.mockResolvedValue(sampleShopClient);
        mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
        mockShopClientService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });
        mockShopClientService.countByShopId.mockResolvedValue(0);
        mockShopClientService.findOne.mockResolvedValue(sampleShopClient);
        mockShopClientService.update.mockResolvedValue(sampleShopClient);
        mockShopClientService.remove.mockResolvedValue({ deleted: true });

        const dto: CreateShopClientDto = { shopId: 'shop-1', userId: 'user-1' };
        const updateDto: UpdateShopClientDto = { customName: 'Test' };

        await controller.create(dto, employeeUser);
        expect(mockShopClientService.create).toHaveBeenCalledWith(dto, employeeUser);

        await controller.findAll(managerUser);
        expect(mockShopClientService.findAll.mock.calls[0][1]).toEqual(managerUser);

        await controller.findByShopId(ownerUser, 'shop-1');
        expect(mockShopClientService.findByShopId.mock.calls[0][2]).toEqual(ownerUser);

        await controller.countByShopId('shop-1', adminUser);
        expect(mockShopClientService.countByShopId).toHaveBeenCalledWith('shop-1', adminUser);

        await controller.findOne('sc-1', employeeUser);
        expect(mockShopClientService.findOne).toHaveBeenCalledWith('sc-1', employeeUser);

        await controller.update('sc-1', updateDto, managerUser);
        expect(mockShopClientService.update).toHaveBeenCalledWith('sc-1', updateDto, managerUser);

        await controller.remove('sc-1', ownerUser);
        expect(mockShopClientService.remove).toHaveBeenCalledWith('sc-1', ownerUser);
      });
    });

    describe('IDOR prevention (accessing other shops clients)', () => {
      it('should propagate ForbiddenException when employee accesses clients from unauthorized shop', async () => {
        mockShopClientService.findByShopId.mockRejectedValue(
          new Error('You are not allowed to access this shop'),
        );

        await expect(
          controller.findByShopId(employeeUser, 'unauthorized-shop', '1', '10'),
        ).rejects.toThrow('You are not allowed to access this shop');
      });

      it('should propagate ForbiddenException on create for unauthorized shop', async () => {
        mockShopClientService.create.mockRejectedValue(
          new Error('You are not allowed to access this shop'),
        );

        const dto: CreateShopClientDto = { shopId: 'unauthorized-shop', userId: 'user-1' };

        await expect(controller.create(dto, employeeUser)).rejects.toThrow(
          'You are not allowed to access this shop',
        );
      });

      it('should propagate error on findOne for client in unauthorized shop', async () => {
        mockShopClientService.findOne.mockRejectedValue(new Error('Shop client not found'));

        await expect(controller.findOne('sc-other-shop', employeeUser)).rejects.toThrow('Shop client not found');
      });

      it('should propagate error on update for client in unauthorized shop', async () => {
        mockShopClientService.update.mockRejectedValue(new Error('Shop client not found'));

        await expect(
          controller.update('sc-other-shop', { customName: 'Hacked' }, employeeUser),
        ).rejects.toThrow('Shop client not found');
      });

      it('should propagate error on remove for client in unauthorized shop', async () => {
        mockShopClientService.remove.mockRejectedValue(new Error('Shop client not found'));

        await expect(controller.remove('sc-other-shop', employeeUser)).rejects.toThrow('Shop client not found');
      });
    });

    describe('Client enumeration prevention', () => {
      it('findAll requires authenticated user -- user param is always forwarded', async () => {
        mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

        await controller.findAll(employeeUser, '1', '10');

        const calledUser = mockShopClientService.findAll.mock.calls[0][1];
        expect(calledUser).toBeDefined();
        expect(calledUser.id).toBe('emp-1');
        expect(calledUser.role).toBe('EMPLOYEE');
      });

      it('countByShopId requires authenticated user for scope', async () => {
        mockShopClientService.countByShopId.mockResolvedValue(0);

        await controller.countByShopId('shop-1', managerUser);

        expect(mockShopClientService.countByShopId).toHaveBeenCalledWith('shop-1', managerUser);
      });
    });

    describe('XSS in client creation fields', () => {
      it('should forward XSS payload in customName to service', async () => {
        const xssDto: CreateShopClientDto = {
          shopId: 'shop-1',
          userId: 'user-1',
          customName: '<script>alert("xss")</script>',
          customPhone: '+5511999999999',
        };
        mockShopClientService.create.mockResolvedValue({ id: 'sc-x' });

        await controller.create(xssDto, adminUser);

        expect(mockShopClientService.create).toHaveBeenCalledWith(xssDto, adminUser);
      });

      it('should forward XSS payload in notes via update', async () => {
        const xssUpdate: UpdateShopClientDto = {
          notes: '<img src=x onerror=alert(document.cookie)>',
          customEmail: '"><svg/onload=alert(1)>@evil.com',
        };
        mockShopClientService.update.mockResolvedValue({ id: 'sc-1' });

        await controller.update('sc-1', xssUpdate, adminUser);

        expect(mockShopClientService.update).toHaveBeenCalledWith('sc-1', xssUpdate, adminUser);
      });

      it('should forward SQL injection payload in search query', async () => {
        mockShopClientService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

        await controller.findAll(adminUser, '1', '10', "'; DROP TABLE shop_clients; --");

        expect(mockShopClientService.findAll).toHaveBeenCalledWith(
          { page: 1, perPage: 10, search: "'; DROP TABLE shop_clients; --" },
          adminUser,
        );
      });

      it('should forward SQL injection payload in search on findByShopId', async () => {
        mockShopClientService.findByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

        await controller.findByShopId(adminUser, 'shop-1', '1', '10', "' OR '1'='1");

        expect(mockShopClientService.findByShopId).toHaveBeenCalledWith(
          'shop-1',
          { page: 1, perPage: 10, search: "' OR '1'='1" },
          adminUser,
        );
      });
    });

    describe('Public endpoint security (findByShopAndUser)', () => {
      it('findByShopAndUser does not require authentication (no user param)', async () => {
        mockShopClientService.findByShopAndUser.mockResolvedValue(sampleShopClient);

        const result = await controller.findByShopAndUser('shop-1', 'user-1');

        // Only shopId and userId are passed, no JwtPayload
        expect(mockShopClientService.findByShopAndUser).toHaveBeenCalledWith('shop-1', 'user-1');
        expect(result).toEqual(sampleShopClient);
      });

      it('should handle invalid UUID-like strings for shopId', async () => {
        mockShopClientService.findByShopAndUser.mockRejectedValue(new Error('Shop not found'));

        await expect(
          controller.findByShopAndUser('not-a-uuid', 'user-1'),
        ).rejects.toThrow('Shop not found');
      });

      it('should handle invalid UUID-like strings for userId', async () => {
        mockShopClientService.findByShopAndUser.mockRejectedValue(new Error('User not found'));

        await expect(
          controller.findByShopAndUser('shop-1', 'not-a-uuid'),
        ).rejects.toThrow('User not found');
      });

      it('should handle path traversal in query params', async () => {
        mockShopClientService.findByShopAndUser.mockRejectedValue(new Error('Shop not found'));

        await expect(
          controller.findByShopAndUser('../../../etc/passwd', 'user-1'),
        ).rejects.toThrow('Shop not found');
      });
    });

    describe('Unauthorized shop creation via shop-client', () => {
      it('should propagate ForbiddenException when unauthorized user creates client', async () => {
        mockShopClientService.create.mockRejectedValue(new Error('You are not allowed to access this shop'));

        const dto: CreateShopClientDto = { shopId: 'shop-1', userId: 'user-1' };

        await expect(controller.create(dto, regularUser)).rejects.toThrow(
          'You are not allowed to access this shop',
        );
      });
    });
  });
});
