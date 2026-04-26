import { Test, TestingModule } from '@nestjs/testing';
import { ShopClientService } from '../shop-client.service';
import { CreateShopClientUseCase } from '../use-cases/create-shop-client.use-case';
import { FindAllShopClientUseCase } from '../use-cases/find-all-shop-client.use-case';
import { FindShopClientByIdUseCase } from '../use-cases/find-shop-client-by-id.use-case';
import { DeleteShopClientUseCase } from '../use-cases/delete-shop-client.use-case';
import { UpdateShopClientUseCase } from '../use-cases/update-shop-client.use-case';
import { FindShopClientByShopAndUserUseCase } from '../use-cases/find-shop-client-by-shop-and-user.use-case';
import { FindAllShopClientRepository } from '../repository';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateShopClientDto } from '../dto/create-shop-client.dto';
import { UpdateShopClientDto } from '../dto/update-shop-client.dto';
import { FilterShopClientDto } from '../dto/filter-shop-client.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockCreateShopClientUseCase = { execute: jest.fn() };
const mockFindAllShopClientUseCase = { execute: jest.fn(), executeByShopId: jest.fn() };
const mockFindShopClientByIdUseCase = { execute: jest.fn() };
const mockDeleteShopClientUseCase = { execute: jest.fn() };
const mockUpdateShopClientUseCase = { execute: jest.fn() };
const mockFindShopClientByShopAndUserUseCase = { execute: jest.fn() };
const mockFindAllShopClientRepository = { countByShopId: jest.fn() };

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
  createdAt: new Date('2025-01-01'),
};

const createDto: CreateShopClientDto = {
  shopId: 'shop-1',
  userId: 'user-1',
  customName: 'John Doe',
  customPhone: '+5511988887777',
};

describe('ShopClientService', () => {
  let service: ShopClientService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopClientService,
        { provide: CreateShopClientUseCase, useValue: mockCreateShopClientUseCase },
        { provide: FindAllShopClientUseCase, useValue: mockFindAllShopClientUseCase },
        { provide: FindShopClientByIdUseCase, useValue: mockFindShopClientByIdUseCase },
        { provide: DeleteShopClientUseCase, useValue: mockDeleteShopClientUseCase },
        { provide: UpdateShopClientUseCase, useValue: mockUpdateShopClientUseCase },
        { provide: FindShopClientByShopAndUserUseCase, useValue: mockFindShopClientByShopAndUserUseCase },
        { provide: FindAllShopClientRepository, useValue: mockFindAllShopClientRepository },
      ],
    }).compile();

    service = module.get<ShopClientService>(ShopClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =======================================================================
  // create
  // =======================================================================
  describe('create', () => {
    it('should delegate to createShopClientUseCase.execute with data and user', async () => {
      mockCreateShopClientUseCase.execute.mockResolvedValue(sampleShopClient);

      const result = await service.create(createDto, adminUser);

      expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(createDto, adminUser);
      expect(result).toEqual(sampleShopClient);
    });

    it('should pass the user context for authorization', async () => {
      mockCreateShopClientUseCase.execute.mockResolvedValue(sampleShopClient);

      await service.create(createDto, ownerUser);

      expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(createDto, ownerUser);
    });

    it('should propagate NotFoundException when shop is not found', async () => {
      mockCreateShopClientUseCase.execute.mockRejectedValue(new Error('Shop not found'));

      await expect(service.create(createDto, adminUser)).rejects.toThrow('Shop not found');
    });

    it('should propagate NotFoundException when user is not found', async () => {
      mockCreateShopClientUseCase.execute.mockRejectedValue(new Error('User not found'));

      await expect(service.create(createDto, adminUser)).rejects.toThrow('User not found');
    });

    it('should return existing shop-client if relationship already exists', async () => {
      const existing = { ...sampleShopClient, id: 'sc-existing' };
      mockCreateShopClientUseCase.execute.mockResolvedValue(existing);

      const result = await service.create(createDto, adminUser);

      expect(result).toEqual(existing);
    });

    it('should propagate ServiceUnavailableException from use case', async () => {
      mockCreateShopClientUseCase.execute.mockRejectedValue(new Error('Something bad happened!'));

      await expect(service.create(createDto, adminUser)).rejects.toThrow('Something bad happened!');
    });

    it('should pass all DTO fields including optional ones', async () => {
      const fullDto: CreateShopClientDto = {
        shopId: 'shop-2',
        userId: 'user-2',
        customName: 'Jane Smith',
        customPhone: '+5511977776666',
        customEmail: 'jane@test.com',
        notes: 'Frequent client',
      };
      mockCreateShopClientUseCase.execute.mockResolvedValue({ id: 'sc-2', ...fullDto });

      await service.create(fullDto, adminUser);

      expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(fullDto, adminUser);
    });
  });

  // =======================================================================
  // findAll
  // =======================================================================
  describe('findAll', () => {
    const paginatedResult = {
      data: [sampleShopClient],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to findAllShopClientUseCase.execute with filters and user', async () => {
      mockFindAllShopClientUseCase.execute.mockResolvedValue(paginatedResult);

      const filters: FilterShopClientDto = { page: 1, perPage: 10, search: 'John' };
      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllShopClientUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should use default empty filters when none provided', async () => {
      mockFindAllShopClientUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findAll(undefined, adminUser);

      expect(mockFindAllShopClientUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should pass user context for shop-scope filtering', async () => {
      mockFindAllShopClientUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findAll({}, employeeUser);

      expect(mockFindAllShopClientUseCase.execute).toHaveBeenCalledWith({}, employeeUser);
    });

    it('should propagate errors from findAllShopClientUseCase', async () => {
      mockFindAllShopClientUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll({}, adminUser)).rejects.toThrow('DB error');
    });
  });

  // =======================================================================
  // findByShopId
  // =======================================================================
  describe('findByShopId', () => {
    const paginatedResult = {
      data: [sampleShopClient],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to findAllShopClientUseCase.executeByShopId', async () => {
      mockFindAllShopClientUseCase.executeByShopId.mockResolvedValue(paginatedResult);

      const result = await service.findByShopId('shop-1', { page: 1, perPage: 10 }, adminUser);

      expect(mockFindAllShopClientUseCase.executeByShopId).toHaveBeenCalledWith(
        'shop-1',
        { page: 1, perPage: 10 },
        adminUser,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should use default empty filters when none provided', async () => {
      mockFindAllShopClientUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findByShopId('shop-1', undefined, adminUser);

      expect(mockFindAllShopClientUseCase.executeByShopId).toHaveBeenCalledWith('shop-1', {}, adminUser);
    });

    it('should pass user context for scope filtering', async () => {
      mockFindAllShopClientUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findByShopId('shop-1', {}, ownerUser);

      expect(mockFindAllShopClientUseCase.executeByShopId).toHaveBeenCalledWith('shop-1', {}, ownerUser);
    });

    it('should propagate errors', async () => {
      mockFindAllShopClientUseCase.executeByShopId.mockRejectedValue(new Error('Forbidden'));

      await expect(service.findByShopId('shop-1', {}, regularUser)).rejects.toThrow('Forbidden');
    });
  });

  // =======================================================================
  // countByShopId
  // =======================================================================
  describe('countByShopId', () => {
    it('should delegate to findAllShopClientRepository.countByShopId', async () => {
      mockFindAllShopClientRepository.countByShopId.mockResolvedValue(42);

      const result = await service.countByShopId('shop-1', adminUser);

      expect(mockFindAllShopClientRepository.countByShopId).toHaveBeenCalledWith('shop-1', adminUser);
      expect(result).toBe(42);
    });

    it('should return 0 when no clients exist', async () => {
      mockFindAllShopClientRepository.countByShopId.mockResolvedValue(0);

      const result = await service.countByShopId('empty-shop', adminUser);

      expect(result).toBe(0);
    });

    it('should pass user context for shop-scope enforcement', async () => {
      mockFindAllShopClientRepository.countByShopId.mockResolvedValue(5);

      await service.countByShopId('shop-1', employeeUser);

      expect(mockFindAllShopClientRepository.countByShopId).toHaveBeenCalledWith('shop-1', employeeUser);
    });

    it('should propagate errors from repository', async () => {
      mockFindAllShopClientRepository.countByShopId.mockRejectedValue(new Error('Access denied'));

      await expect(service.countByShopId('shop-1', regularUser)).rejects.toThrow('Access denied');
    });
  });

  // =======================================================================
  // findByShopAndUser
  // =======================================================================
  describe('findByShopAndUser', () => {
    it('should delegate to findShopClientByShopAndUserUseCase.execute', async () => {
      mockFindShopClientByShopAndUserUseCase.execute.mockResolvedValue(sampleShopClient);

      const result = await service.findByShopAndUser('shop-1', 'user-1');

      expect(mockFindShopClientByShopAndUserUseCase.execute).toHaveBeenCalledWith('shop-1', 'user-1');
      expect(result).toEqual(sampleShopClient);
    });

    it('should propagate NotFoundException when relationship does not exist', async () => {
      mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(
        new Error('Shop client relationship not found'),
      );

      await expect(service.findByShopAndUser('shop-1', 'unknown-user')).rejects.toThrow(
        'Shop client relationship not found',
      );
    });

    it('should propagate BadRequestException if shopId or userId is empty', async () => {
      mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(
        new Error('Shop ID and User ID must be provided'),
      );

      await expect(service.findByShopAndUser('', 'user-1')).rejects.toThrow(
        'Shop ID and User ID must be provided',
      );
    });

    it('should propagate error when shop does not exist', async () => {
      mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(new Error('Shop not found'));

      await expect(service.findByShopAndUser('nonexistent-shop', 'user-1')).rejects.toThrow('Shop not found');
    });

    it('should propagate error when user does not exist', async () => {
      mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(new Error('User not found'));

      await expect(service.findByShopAndUser('shop-1', 'nonexistent-user')).rejects.toThrow('User not found');
    });
  });

  // =======================================================================
  // findOne
  // =======================================================================
  describe('findOne', () => {
    it('should delegate to findShopClientByIdUseCase.execute with id and user', async () => {
      mockFindShopClientByIdUseCase.execute.mockResolvedValue(sampleShopClient);

      const result = await service.findOne('sc-1', adminUser);

      expect(mockFindShopClientByIdUseCase.execute).toHaveBeenCalledWith('sc-1', adminUser);
      expect(result).toEqual(sampleShopClient);
    });

    it('should propagate NotFoundException when shop client does not exist', async () => {
      mockFindShopClientByIdUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

      await expect(service.findOne('nonexistent', adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should pass different user contexts', async () => {
      mockFindShopClientByIdUseCase.execute.mockResolvedValue(sampleShopClient);

      await service.findOne('sc-1', ownerUser);
      expect(mockFindShopClientByIdUseCase.execute).toHaveBeenCalledWith('sc-1', ownerUser);

      await service.findOne('sc-1', employeeUser);
      expect(mockFindShopClientByIdUseCase.execute).toHaveBeenCalledWith('sc-1', employeeUser);
    });
  });

  // =======================================================================
  // update
  // =======================================================================
  describe('update', () => {
    const updateDto: UpdateShopClientDto = { customName: 'Updated Name' };

    it('should delegate to updateShopClientUseCase.execute with id, data, and user', async () => {
      const updated = { ...sampleShopClient, customName: 'Updated Name' };
      mockUpdateShopClientUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('sc-1', updateDto, adminUser);

      expect(mockUpdateShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', updateDto, adminUser);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when shop client not found', async () => {
      mockUpdateShopClientUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

      await expect(service.update('nonexistent', updateDto, adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should allow updating all optional fields', async () => {
      const fullUpdate: UpdateShopClientDto = {
        customName: 'New Name',
        customPhone: '+5511966665555',
        customEmail: 'new@test.com',
        notes: 'Updated notes',
      };
      mockUpdateShopClientUseCase.execute.mockResolvedValue({ id: 'sc-1', ...fullUpdate });

      await service.update('sc-1', fullUpdate, adminUser);

      expect(mockUpdateShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', fullUpdate, adminUser);
    });

    it('should pass user context for authorization check', async () => {
      mockUpdateShopClientUseCase.execute.mockResolvedValue(sampleShopClient);

      await service.update('sc-1', updateDto, managerUser);

      expect(mockUpdateShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', updateDto, managerUser);
    });
  });

  // =======================================================================
  // remove
  // =======================================================================
  describe('remove', () => {
    it('should delegate to deleteShopClientUseCase.execute with id and user', async () => {
      mockDeleteShopClientUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('sc-1', adminUser);

      expect(mockDeleteShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate NotFoundException when shop client not found', async () => {
      mockDeleteShopClientUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

      await expect(service.remove('nonexistent', adminUser)).rejects.toThrow('Shop client not found');
    });

    it('should pass user context for authorization', async () => {
      mockDeleteShopClientUseCase.execute.mockResolvedValue({ deleted: true });

      await service.remove('sc-1', employeeUser);

      expect(mockDeleteShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', employeeUser);
    });
  });

  // =======================================================================
  // Security Tests
  // =======================================================================
  describe('Security', () => {
    describe('Multi-tenant isolation (user context propagation)', () => {
      it('create should pass user context so use case can enforce shop scope', async () => {
        mockCreateShopClientUseCase.execute.mockResolvedValue(sampleShopClient);

        await service.create(createDto, employeeUser);

        expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(createDto, employeeUser);
      });

      it('findAll should pass user context so repository can enforce shop scope', async () => {
        mockFindAllShopClientUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

        await service.findAll({}, managerUser);

        expect(mockFindAllShopClientUseCase.execute).toHaveBeenCalledWith({}, managerUser);
      });

      it('findByShopId should pass user context for cross-shop protection', async () => {
        mockFindAllShopClientUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

        await service.findByShopId('shop-1', {}, ownerUser);

        expect(mockFindAllShopClientUseCase.executeByShopId).toHaveBeenCalledWith('shop-1', {}, ownerUser);
      });

      it('findOne should pass user context for access control', async () => {
        mockFindShopClientByIdUseCase.execute.mockResolvedValue(sampleShopClient);

        await service.findOne('sc-1', managerUser);

        expect(mockFindShopClientByIdUseCase.execute).toHaveBeenCalledWith('sc-1', managerUser);
      });

      it('update should pass user context for authorization', async () => {
        mockUpdateShopClientUseCase.execute.mockResolvedValue(sampleShopClient);

        await service.update('sc-1', { customName: 'New' }, employeeUser);

        expect(mockUpdateShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', { customName: 'New' }, employeeUser);
      });

      it('remove should pass user context for authorization', async () => {
        mockDeleteShopClientUseCase.execute.mockResolvedValue({ deleted: true });

        await service.remove('sc-1', ownerUser);

        expect(mockDeleteShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', ownerUser);
      });

      it('countByShopId should pass user context for scope enforcement', async () => {
        mockFindAllShopClientRepository.countByShopId.mockResolvedValue(10);

        await service.countByShopId('shop-1', managerUser);

        expect(mockFindAllShopClientRepository.countByShopId).toHaveBeenCalledWith('shop-1', managerUser);
      });
    });

    describe('IDOR prevention (accessing other shops clients)', () => {
      it('should propagate ForbiddenException when user tries to access clients of a shop they do not own', async () => {
        mockCreateShopClientUseCase.execute.mockRejectedValue(new Error('You are not allowed to access this shop'));

        const dtoForOtherShop: CreateShopClientDto = {
          shopId: 'other-shop',
          userId: 'user-1',
        };

        await expect(service.create(dtoForOtherShop, employeeUser)).rejects.toThrow(
          'You are not allowed to access this shop',
        );
      });

      it('should propagate ForbiddenException when listing clients from unauthorized shop', async () => {
        mockFindAllShopClientUseCase.executeByShopId.mockRejectedValue(
          new Error('You are not allowed to access this shop'),
        );

        await expect(service.findByShopId('unauthorized-shop', {}, employeeUser)).rejects.toThrow(
          'You are not allowed to access this shop',
        );
      });

      it('should propagate ForbiddenException on findOne for client belonging to another shop', async () => {
        mockFindShopClientByIdUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

        await expect(service.findOne('sc-other', employeeUser)).rejects.toThrow('Shop client not found');
      });

      it('should propagate ForbiddenException on update for client belonging to another shop', async () => {
        mockUpdateShopClientUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

        await expect(
          service.update('sc-other', { customName: 'Hacked' }, employeeUser),
        ).rejects.toThrow('Shop client not found');
      });

      it('should propagate ForbiddenException on remove for client belonging to another shop', async () => {
        mockDeleteShopClientUseCase.execute.mockRejectedValue(new Error('Shop client not found'));

        await expect(service.remove('sc-other', employeeUser)).rejects.toThrow('Shop client not found');
      });
    });

    describe('Client enumeration prevention', () => {
      it('findAll always requires user context (cannot be called without user)', async () => {
        mockFindAllShopClientUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

        // Verify that user is always passed (not undefined)
        await service.findAll({}, adminUser);
        const call = mockFindAllShopClientUseCase.execute.mock.calls[0];
        expect(call[1]).toBeDefined();
        expect(call[1]).toHaveProperty('id');
        expect(call[1]).toHaveProperty('role');
      });

      it('findByShopId always requires user context', async () => {
        mockFindAllShopClientUseCase.executeByShopId.mockResolvedValue({ data: [], meta: { total: 0 } });

        await service.findByShopId('shop-1', {}, ownerUser);
        const call = mockFindAllShopClientUseCase.executeByShopId.mock.calls[0];
        expect(call[2]).toBeDefined();
        expect(call[2]).toHaveProperty('id');
        expect(call[2]).toHaveProperty('role');
      });

      it('countByShopId always requires user context', async () => {
        mockFindAllShopClientRepository.countByShopId.mockResolvedValue(0);

        await service.countByShopId('shop-1', adminUser);
        const call = mockFindAllShopClientRepository.countByShopId.mock.calls[0];
        expect(call[1]).toBeDefined();
        expect(call[1]).toHaveProperty('id');
      });
    });

    describe('Input validation concerns (XSS in client fields)', () => {
      it('should forward XSS payload in customName to use case (DTO validation responsibility)', async () => {
        const xssDto: CreateShopClientDto = {
          shopId: 'shop-1',
          userId: 'user-1',
          customName: '<script>alert("xss")</script>',
        };
        mockCreateShopClientUseCase.execute.mockResolvedValue({ id: 'sc-x', ...xssDto });

        await service.create(xssDto, adminUser);

        expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(xssDto, adminUser);
      });

      it('should forward XSS payload in notes via update', async () => {
        const xssUpdate: UpdateShopClientDto = {
          notes: '<img src=x onerror=alert(document.cookie)>',
          customEmail: '"><script>alert(1)</script>@evil.com',
        };
        mockUpdateShopClientUseCase.execute.mockResolvedValue({ id: 'sc-1', ...xssUpdate });

        await service.update('sc-1', xssUpdate, adminUser);

        expect(mockUpdateShopClientUseCase.execute).toHaveBeenCalledWith('sc-1', xssUpdate, adminUser);
      });

      it('should forward SQL injection payload in customName', async () => {
        const sqlDto: CreateShopClientDto = {
          shopId: 'shop-1',
          userId: 'user-1',
          customName: "'; DROP TABLE shop_clients; --",
        };
        mockCreateShopClientUseCase.execute.mockResolvedValue({ id: 'sc-sql', ...sqlDto });

        await service.create(sqlDto, adminUser);

        expect(mockCreateShopClientUseCase.execute).toHaveBeenCalledWith(sqlDto, adminUser);
      });
    });

    describe('findByShopAndUser (public endpoint)', () => {
      it('does not require user authentication (no JwtPayload parameter)', async () => {
        mockFindShopClientByShopAndUserUseCase.execute.mockResolvedValue(sampleShopClient);

        // The method signature does NOT take a user parameter
        const result = await service.findByShopAndUser('shop-1', 'user-1');

        expect(mockFindShopClientByShopAndUserUseCase.execute).toHaveBeenCalledWith('shop-1', 'user-1');
        expect(result).toEqual(sampleShopClient);
      });

      it('should propagate BadRequestException for empty shopId', async () => {
        mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(
          new Error('Shop ID and User ID must be provided'),
        );

        await expect(service.findByShopAndUser('', 'user-1')).rejects.toThrow(
          'Shop ID and User ID must be provided',
        );
      });

      it('should propagate BadRequestException for empty userId', async () => {
        mockFindShopClientByShopAndUserUseCase.execute.mockRejectedValue(
          new Error('Shop ID and User ID must be provided'),
        );

        await expect(service.findByShopAndUser('shop-1', '')).rejects.toThrow(
          'Shop ID and User ID must be provided',
        );
      });
    });
  });
});
