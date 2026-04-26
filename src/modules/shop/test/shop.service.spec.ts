import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ShopService } from '../shop.service';
import { CreateShopUseCase } from '../use-cases/create-shop.use-case';
import { FindAllShopUseCase } from '../use-cases/find-all-shop.use-case';
import { FindShopByIdUseCase } from '../use-cases/find-shop-by-id.use-case';
import { UpdateShopUseCase } from '../use-cases/update-shop.use-case';
import { DeleteShopUseCase } from '../use-cases/delete-shop.use-case';
import { FindShopBySlugUseCase } from '../use-cases/find-shop-by-slug.use-case';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateShopDto } from '../dto/create-shop.dto';
import { UpdateShopDto } from '../dto/update-shop.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockCreateShopUseCase = { execute: jest.fn() };
const mockFindAllShopUseCase = { execute: jest.fn() };
const mockFindShopByIdUseCase = { execute: jest.fn() };
const mockUpdateShopUseCase = { execute: jest.fn() };
const mockDeleteShopUseCase = { execute: jest.fn() };
const mockFindShopBySlugUseCase = { execute: jest.fn() };

const mockPrismaService = {
  organization: { findUnique: jest.fn() },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511900000000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511900000001', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'mgr@test.com', phone: '+5511900000002', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511900000003', role: 'EMPLOYEE' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511900000004', role: 'USER' };

const validCreateDto: CreateShopDto = {
  name: 'Lava Car Centro',
  phone: '+5511999999999',
  zipCode: '01001000',
  street: 'Rua XV de Novembro',
  number: '100',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  organizationId: 'org-1',
};

const sampleShop = {
  id: 'shop-1',
  name: 'Lava Car Centro',
  slug: 'lava-car-centro',
  phone: '+5511999999999',
  organizationId: 'org-1',
  status: 'ACTIVE',
  logoUrl: null,
  bannerUrl: null,
  gallery: [],
};

describe('ShopService', () => {
  let service: ShopService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        { provide: CreateShopUseCase, useValue: mockCreateShopUseCase },
        { provide: FindAllShopUseCase, useValue: mockFindAllShopUseCase },
        { provide: FindShopByIdUseCase, useValue: mockFindShopByIdUseCase },
        { provide: UpdateShopUseCase, useValue: mockUpdateShopUseCase },
        { provide: DeleteShopUseCase, useValue: mockDeleteShopUseCase },
        { provide: FindShopBySlugUseCase, useValue: mockFindShopBySlugUseCase },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =======================================================================
  // create
  // =======================================================================
  describe('create', () => {
    it('should allow ADMIN to create a shop without ownership check', async () => {
      mockCreateShopUseCase.execute.mockResolvedValue(sampleShop);

      const result = await service.create(validCreateDto, adminUser);

      expect(mockPrismaService.organization.findUnique).not.toHaveBeenCalled();
      expect(mockCreateShopUseCase.execute).toHaveBeenCalledWith(validCreateDto);
      expect(result).toEqual(sampleShop);
    });

    it('should allow OWNER who owns the organization to create a shop', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: ownerUser.id });
      mockCreateShopUseCase.execute.mockResolvedValue(sampleShop);

      const result = await service.create(validCreateDto, ownerUser);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: validCreateDto.organizationId },
        select: { ownerId: true },
      });
      expect(mockCreateShopUseCase.execute).toHaveBeenCalledWith(validCreateDto);
      expect(result).toEqual(sampleShop);
    });

    it('should throw ForbiddenException if OWNER does not own the organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'different-owner' });

      await expect(service.create(validCreateDto, ownerUser)).rejects.toThrow(ForbiddenException);
      await expect(service.create(validCreateDto, ownerUser)).rejects.toThrow('You do not own this organization');
      expect(mockCreateShopUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if organization is not found (non-ADMIN)', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(validCreateDto, ownerUser)).rejects.toThrow(ForbiddenException);
      expect(mockCreateShopUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for MANAGER role creating a shop they do not own', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });

      await expect(service.create(validCreateDto, managerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for EMPLOYEE role creating a shop they do not own', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });

      await expect(service.create(validCreateDto, employeeUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for USER role (organization not owned)', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });

      await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate errors from CreateShopUseCase', async () => {
      mockCreateShopUseCase.execute.mockRejectedValue(new Error('DB connection failed'));

      await expect(service.create(validCreateDto, adminUser)).rejects.toThrow('DB connection failed');
    });

    it('should pass the full DTO to the use case', async () => {
      const fullDto: CreateShopDto = {
        ...validCreateDto,
        slug: 'custom-slug',
        description: 'Best lava car in town',
        document: '12345678000190',
        email: 'shop@test.com',
        status: 'ACTIVE' as any,
        timeZone: 'America/Sao_Paulo',
        slotInterval: 30,
        bufferBetweenSlots: 5,
        maxAdvanceDays: 30,
        minAdvanceMinutes: 60,
        ownerId: 'owner-uuid',
      };
      mockCreateShopUseCase.execute.mockResolvedValue({ id: 'shop-2', ...fullDto });

      await service.create(fullDto, adminUser);

      expect(mockCreateShopUseCase.execute).toHaveBeenCalledWith(fullDto);
    });
  });

  // =======================================================================
  // findAll
  // =======================================================================
  describe('findAll', () => {
    it('should delegate to FindAllShopUseCase with filters', async () => {
      const shopList = [sampleShop];
      mockFindAllShopUseCase.execute.mockResolvedValue({ data: shopList, meta: { total: 1 } });

      const filters = { organizationId: 'org-1', page: 1, perPage: 10 };
      const result = await service.findAll(filters);

      expect(mockFindAllShopUseCase.execute).toHaveBeenCalledWith(filters);
      expect(result).toEqual({ data: shopList, meta: { total: 1 } });
    });

    it('should work without filters (undefined)', async () => {
      mockFindAllShopUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

      const result = await service.findAll();

      expect(mockFindAllShopUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ data: [], meta: { total: 0 } });
    });

    it('should pass partial filters', async () => {
      mockFindAllShopUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findAll({ page: 2 });

      expect(mockFindAllShopUseCase.execute).toHaveBeenCalledWith({ page: 2 });
    });

    it('should propagate errors from FindAllShopUseCase', async () => {
      mockFindAllShopUseCase.execute.mockRejectedValue(new Error('DB timeout'));

      await expect(service.findAll()).rejects.toThrow('DB timeout');
    });
  });

  // =======================================================================
  // findOne
  // =======================================================================
  describe('findOne', () => {
    it('should delegate to FindShopByIdUseCase', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue(sampleShop);

      const result = await service.findOne('shop-1');

      expect(mockFindShopByIdUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual(sampleShop);
    });

    it('should propagate NotFoundException when shop does not exist', async () => {
      mockFindShopByIdUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

      await expect(service.findOne('nonexistent-id')).rejects.toThrow('Shop not found!');
    });

    it('should propagate unexpected errors', async () => {
      mockFindShopByIdUseCase.execute.mockRejectedValue(new Error('Internal error'));

      await expect(service.findOne('shop-1')).rejects.toThrow('Internal error');
    });
  });

  // =======================================================================
  // update
  // =======================================================================
  describe('update', () => {
    it('should delegate to UpdateShopUseCase with id and data', async () => {
      const updateDto: UpdateShopDto = { name: 'Updated Name' } as any;
      const updated = { ...sampleShop, name: 'Updated Name' };
      mockUpdateShopUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('shop-1', updateDto);

      expect(mockUpdateShopUseCase.execute).toHaveBeenCalledWith('shop-1', updateDto);
      expect(result).toEqual(updated);
    });

    it('should allow updating multiple fields', async () => {
      const updateDto: UpdateShopDto = {
        name: 'New Name',
        description: 'New Description',
        phone: '+5511888888888',
        slug: 'new-slug',
      } as any;
      mockUpdateShopUseCase.execute.mockResolvedValue({ id: 'shop-1', ...updateDto });

      await service.update('shop-1', updateDto);

      expect(mockUpdateShopUseCase.execute).toHaveBeenCalledWith('shop-1', updateDto);
    });

    it('should propagate errors from UpdateShopUseCase', async () => {
      mockUpdateShopUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(service.update('missing-id', {} as any)).rejects.toThrow('Not found');
    });
  });

  // =======================================================================
  // remove
  // =======================================================================
  describe('remove', () => {
    it('should allow ADMIN to delete any shop without ownership check', async () => {
      mockDeleteShopUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('shop-1', adminUser);

      expect(mockFindShopByIdUseCase.execute).not.toHaveBeenCalled();
      expect(mockPrismaService.organization.findUnique).not.toHaveBeenCalled();
      expect(mockDeleteShopUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual({ deleted: true });
    });

    it('should allow OWNER to delete shop if they own the organization', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-1' });
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: ownerUser.id });
      mockDeleteShopUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('shop-1', ownerUser);

      expect(mockFindShopByIdUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        select: { ownerId: true },
      });
      expect(mockDeleteShopUseCase.execute).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw ForbiddenException if OWNER does not own the organization', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-1' });
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'different-owner' });

      await expect(service.remove('shop-1', ownerUser)).rejects.toThrow(ForbiddenException);
      await expect(service.remove('shop-1', ownerUser)).rejects.toThrow(
        'Only the organization owner can delete shops',
      );
      expect(mockDeleteShopUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if organization is not found (non-ADMIN)', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-1' });
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.remove('shop-1', managerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for EMPLOYEE trying to delete a shop', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-1' });
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });

      await expect(service.remove('shop-1', employeeUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for MANAGER trying to delete a shop they do not own', async () => {
      mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-1' });
      mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'someone-else' });

      await expect(service.remove('shop-1', managerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should propagate errors from FindShopByIdUseCase during remove', async () => {
      mockFindShopByIdUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

      await expect(service.remove('nonexistent', ownerUser)).rejects.toThrow('Shop not found!');
    });

    it('should propagate errors from DeleteShopUseCase', async () => {
      mockDeleteShopUseCase.execute.mockRejectedValue(new Error('Cascade error'));

      await expect(service.remove('shop-1', adminUser)).rejects.toThrow('Cascade error');
    });
  });

  // =======================================================================
  // findBySlug
  // =======================================================================
  describe('findBySlug', () => {
    it('should delegate to FindShopBySlugUseCase', async () => {
      const shop = { ...sampleShop, slug: 'lava-car-centro' };
      mockFindShopBySlugUseCase.execute.mockResolvedValue(shop);

      const result = await service.findBySlug('lava-car-centro');

      expect(mockFindShopBySlugUseCase.execute).toHaveBeenCalledWith('lava-car-centro');
      expect(result).toEqual(shop);
    });

    it('should propagate NotFoundException when slug does not exist', async () => {
      mockFindShopBySlugUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow('Shop not found!');
    });

    it('should handle empty string slug', async () => {
      mockFindShopBySlugUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

      await expect(service.findBySlug('')).rejects.toThrow('Shop not found!');
    });
  });

  // =======================================================================
  // Security Tests
  // =======================================================================
  describe('Security', () => {
    describe('Multi-tenant isolation', () => {
      it('ADMIN bypasses ownership check on create', async () => {
        mockCreateShopUseCase.execute.mockResolvedValue(sampleShop);

        await service.create({ ...validCreateDto, organizationId: 'any-org' }, adminUser);

        expect(mockPrismaService.organization.findUnique).not.toHaveBeenCalled();
      });

      it('ADMIN bypasses ownership check on remove', async () => {
        mockDeleteShopUseCase.execute.mockResolvedValue({ deleted: true });

        await service.remove('any-shop-id', adminUser);

        expect(mockFindShopByIdUseCase.execute).not.toHaveBeenCalled();
        expect(mockPrismaService.organization.findUnique).not.toHaveBeenCalled();
      });

      it('non-ADMIN cannot create shop in org they do not own', async () => {
        mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'other-person' });

        for (const user of [ownerUser, managerUser, employeeUser, regularUser]) {
          await expect(
            service.create({ ...validCreateDto, organizationId: 'org-2' }, user),
          ).rejects.toThrow(ForbiddenException);
        }
      });

      it('non-ADMIN cannot delete shop in org they do not own', async () => {
        mockFindShopByIdUseCase.execute.mockResolvedValue({ id: 'shop-1', organizationId: 'org-2' });
        mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'other-person' });

        for (const user of [ownerUser, managerUser, employeeUser]) {
          await expect(service.remove('shop-1', user)).rejects.toThrow(ForbiddenException);
        }
      });
    });

    describe('Unauthorized shop creation', () => {
      it('should reject create when organization lookup returns null', async () => {
        mockPrismaService.organization.findUnique.mockResolvedValue(null);

        await expect(service.create(validCreateDto, employeeUser)).rejects.toThrow(ForbiddenException);
        expect(mockCreateShopUseCase.execute).not.toHaveBeenCalled();
      });

      it('should reject create when ownerId mismatch for every non-admin role', async () => {
        mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'completely-different' });

        const nonAdminUsers = [ownerUser, managerUser, employeeUser, regularUser];
        for (const user of nonAdminUsers) {
          mockCreateShopUseCase.execute.mockClear();
          await expect(service.create(validCreateDto, user)).rejects.toThrow(ForbiddenException);
          expect(mockCreateShopUseCase.execute).not.toHaveBeenCalled();
        }
      });
    });

    describe('Slug injection prevention (service layer passthrough)', () => {
      it('should pass slug as-is to use case (validation happens in DTO/use-case)', async () => {
        const dtoWithMaliciousSlug = {
          ...validCreateDto,
          slug: '../../../etc/passwd',
        };
        mockCreateShopUseCase.execute.mockResolvedValue({ ...sampleShop, slug: 'etc-passwd' });

        await service.create(dtoWithMaliciousSlug, adminUser);

        expect(mockCreateShopUseCase.execute).toHaveBeenCalledWith(dtoWithMaliciousSlug);
      });

      it('should pass slug with HTML/script tags to use case for downstream sanitization', async () => {
        mockFindShopBySlugUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

        await expect(service.findBySlug('<script>alert("xss")</script>')).rejects.toThrow('Shop not found!');
        expect(mockFindShopBySlugUseCase.execute).toHaveBeenCalledWith('<script>alert("xss")</script>');
      });

      it('should pass URL-encoded slug to use case', async () => {
        mockFindShopBySlugUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

        await expect(service.findBySlug('%2F..%2F..%2Fetc%2Fpasswd')).rejects.toThrow('Shop not found!');
        expect(mockFindShopBySlugUseCase.execute).toHaveBeenCalledWith('%2F..%2F..%2Fetc%2Fpasswd');
      });

      it('should pass slug with SQL injection attempt to use case', async () => {
        mockFindShopBySlugUseCase.execute.mockRejectedValue(new Error('Shop not found!'));

        await expect(service.findBySlug("' OR 1=1; --")).rejects.toThrow('Shop not found!');
        expect(mockFindShopBySlugUseCase.execute).toHaveBeenCalledWith("' OR 1=1; --");
      });
    });

    describe('XSS in shop names and descriptions', () => {
      it('should forward XSS payloads in name to use case (DTO validation is separate)', async () => {
        const xssDto = {
          ...validCreateDto,
          name: '<img src=x onerror=alert(1)>',
          description: '<script>document.cookie</script>',
        };
        mockCreateShopUseCase.execute.mockResolvedValue({ id: 'shop-xss', ...xssDto });

        await service.create(xssDto, adminUser);

        expect(mockCreateShopUseCase.execute).toHaveBeenCalledWith(xssDto);
      });

      it('should forward XSS payloads in update to use case', async () => {
        const xssUpdate: UpdateShopDto = {
          name: '"><svg/onload=alert(1)>',
          description: 'javascript:alert(1)',
        } as any;
        mockUpdateShopUseCase.execute.mockResolvedValue({ id: 'shop-1', ...xssUpdate });

        await service.update('shop-1', xssUpdate);

        expect(mockUpdateShopUseCase.execute).toHaveBeenCalledWith('shop-1', xssUpdate);
      });
    });

    describe('IDOR prevention for cross-shop access', () => {
      it('non-ADMIN deleting shop-A should check org ownership for shop-A not shop-B', async () => {
        const shopA = { id: 'shop-A', organizationId: 'org-A' };
        mockFindShopByIdUseCase.execute.mockResolvedValue(shopA);
        mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: ownerUser.id });
        mockDeleteShopUseCase.execute.mockResolvedValue({ deleted: true });

        await service.remove('shop-A', ownerUser);

        expect(mockFindShopByIdUseCase.execute).toHaveBeenCalledWith('shop-A');
        expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
          where: { id: 'org-A' },
          select: { ownerId: true },
        });
      });

      it('non-ADMIN cannot delete a shop belonging to a different organization', async () => {
        const shopB = { id: 'shop-B', organizationId: 'org-B' };
        mockFindShopByIdUseCase.execute.mockResolvedValue(shopB);
        mockPrismaService.organization.findUnique.mockResolvedValue({ ownerId: 'other-owner' });

        await expect(service.remove('shop-B', ownerUser)).rejects.toThrow(ForbiddenException);
        expect(mockDeleteShopUseCase.execute).not.toHaveBeenCalled();
      });
    });
  });
});
