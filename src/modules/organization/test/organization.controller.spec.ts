import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrganizationController } from '../organization.controller';
import { OrganizationService } from '../organization.service';
import { StorageService } from '../../storage/storage.service';
import { CanAccessOrganizationWithBillingGuard } from 'src/guards/can-access-organization-with-billing.guard';

const mockOrganizationService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByOwner: jest.fn(),
  findDashboardMetrics: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

describe('OrganizationController', () => {
  let controller: OrganizationController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    })
      .overrideGuard(CanAccessOrganizationWithBillingGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /organizations
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      name: 'Lavacar Central',
      document: '12345678000100',
      ownerId: 'owner-uuid-1',
    };

    it('should delegate to organizationService.create', async () => {
      const org = { id: 'org-1', ...createDto };
      mockOrganizationService.create.mockResolvedValue(org);

      const result = await controller.create(createDto as any);

      expect(mockOrganizationService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(org);
    });

    it('should forward the entire DTO to service', async () => {
      const fullDto = { ...createDto, logoUrl: 'https://cdn/logo.png' };
      mockOrganizationService.create.mockResolvedValue({ id: 'org-1' });

      await controller.create(fullDto as any);

      expect(mockOrganizationService.create).toHaveBeenCalledWith(fullDto);
    });

    it('should propagate errors from service', async () => {
      mockOrganizationService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createDto as any)).rejects.toThrow('Creation failed');
    });

    it('should propagate BadRequestException for duplicate document', async () => {
      mockOrganizationService.create.mockRejectedValue(
        new BadRequestException('Organization with this document already exists.'),
      );

      await expect(controller.create(createDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------
  // GET /organizations
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should parse page and perPage query params as integers', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('2', '15');

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({
        page: 2,
        perPage: 15,
      });
    });

    it('should pass undefined for missing query params', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(undefined, undefined);

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({
        page: undefined,
        perPage: undefined,
      });
    });

    it('should pass undefined for partial query params', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('1', undefined);

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({
        page: 1,
        perPage: undefined,
      });
    });

    it('should handle NaN from non-numeric query params', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('abc', 'xyz');

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({
        page: NaN,
        perPage: NaN,
      });
    });

    it('should return paginated results', async () => {
      const result = {
        data: [{ id: 'org-1' }, { id: 'org-2' }],
        meta: { total: 2, page: 1, perPage: 10 },
      };
      mockOrganizationService.findAll.mockResolvedValue(result);

      const response = await controller.findAll('1', '10');

      expect(response).toEqual(result);
    });

    it('should propagate errors from service', async () => {
      mockOrganizationService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll('1', '10')).rejects.toThrow('DB error');
    });
  });

  // -----------------------------------------------------------
  // GET /organizations/:id
  // -----------------------------------------------------------
  describe('findById', () => {
    it('should delegate to organizationService.findById', async () => {
      const org = { id: 'org-1', name: 'Lavacar Central' };
      mockOrganizationService.findById.mockResolvedValue(org);

      const result = await controller.findById('org-1');

      expect(mockOrganizationService.findById).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockOrganizationService.findById.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(controller.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // GET /organizations/:id/dashboard-metrics
  // -----------------------------------------------------------
  describe('findDashboardMetrics', () => {
    it('should delegate with period filter', async () => {
      const metrics = { totalRevenue: 5000 };
      mockOrganizationService.findDashboardMetrics.mockResolvedValue(metrics);

      const result = await controller.findDashboardMetrics('org-1', '30d', undefined, undefined);

      expect(mockOrganizationService.findDashboardMetrics).toHaveBeenCalledWith('org-1', {
        period: '30d',
        startDate: undefined,
        endDate: undefined,
      });
      expect(result).toEqual(metrics);
    });

    it('should pass date range filters with Date conversion', async () => {
      mockOrganizationService.findDashboardMetrics.mockResolvedValue({});

      await controller.findDashboardMetrics('org-1', undefined, '2025-01-01', '2025-01-31');

      const call = mockOrganizationService.findDashboardMetrics.mock.calls[0];
      expect(call[0]).toBe('org-1');
      expect(call[1].startDate).toBeInstanceOf(Date);
      expect(call[1].endDate).toBeInstanceOf(Date);
      expect(call[1].period).toBeUndefined();
    });

    it('should pass undefined for all missing optional params', async () => {
      mockOrganizationService.findDashboardMetrics.mockResolvedValue({});

      await controller.findDashboardMetrics('org-1', undefined, undefined, undefined);

      expect(mockOrganizationService.findDashboardMetrics).toHaveBeenCalledWith('org-1', {
        period: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should propagate errors from service', async () => {
      mockOrganizationService.findDashboardMetrics.mockRejectedValue(new Error('fail'));

      await expect(
        controller.findDashboardMetrics('org-1', '7d', undefined, undefined),
      ).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // GET /organizations/slug/:slug
  // -----------------------------------------------------------
  describe('findBySlug', () => {
    it('should delegate to organizationService.findBySlug', async () => {
      const org = { id: 'org-1', slug: 'lavacar-central' };
      mockOrganizationService.findBySlug.mockResolvedValue(org);

      const result = await controller.findBySlug('lavacar-central');

      expect(mockOrganizationService.findBySlug).toHaveBeenCalledWith('lavacar-central');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockOrganizationService.findBySlug.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(controller.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // GET /organizations/owner/:ownerId
  // -----------------------------------------------------------
  describe('findByOwner', () => {
    it('should delegate to organizationService.findByOwner', async () => {
      const org = { id: 'org-1', ownerId: 'owner-1' };
      mockOrganizationService.findByOwner.mockResolvedValue(org);

      const result = await controller.findByOwner('owner-1');

      expect(mockOrganizationService.findByOwner).toHaveBeenCalledWith('owner-1');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockOrganizationService.findByOwner.mockRejectedValue(
        new NotFoundException('Organization not found'),
      );

      await expect(controller.findByOwner('bad-owner')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // PATCH /organizations/:id
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to organizationService.update', async () => {
      const updateDto = { name: 'Updated Org' };
      const updated = { id: 'org-1', name: 'Updated Org' };
      mockOrganizationService.update.mockResolvedValue(updated);

      const result = await controller.update('org-1', updateDto as any);

      expect(mockOrganizationService.update).toHaveBeenCalledWith('org-1', updateDto);
      expect(result).toEqual(updated);
    });

    it('should forward partial update DTO', async () => {
      const updateDto = { isActive: false };
      mockOrganizationService.update.mockResolvedValue({ id: 'org-1', isActive: false });

      await controller.update('org-1', updateDto as any);

      expect(mockOrganizationService.update).toHaveBeenCalledWith('org-1', updateDto);
    });

    it('should propagate errors from service', async () => {
      mockOrganizationService.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('org-1', {} as any)).rejects.toThrow('Update failed');
    });
  });

  // -----------------------------------------------------------
  // POST /organizations/:id/upload/logo
  // -----------------------------------------------------------
  describe('uploadLogo', () => {
    const mockFile = {
      buffer: Buffer.from('image-content'),
      mimetype: 'image/png',
      originalname: 'logo.png',
    } as Express.Multer.File;

    it('should upload logo and update organization', async () => {
      const org = { id: 'org-1', logoUrl: null };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn/new-logo.png');
      mockOrganizationService.update.mockResolvedValue({});

      const result = await controller.uploadLogo('org-1', mockFile);

      expect(mockOrganizationService.findById).toHaveBeenCalledWith('org-1');
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        fileType: 'IMAGE',
        context: {
          type: 'ORGANIZATION',
          organizationId: 'org-1',
          category: 'logo',
        },
      });
      expect(mockOrganizationService.update).toHaveBeenCalledWith('org-1', {
        logoUrl: 'https://cdn/new-logo.png',
      });
      expect(result).toEqual({ url: 'https://cdn/new-logo.png' });
    });

    it('should delete old logo before uploading new one', async () => {
      const org = { id: 'org-1', logoUrl: 'https://cdn/old-logo.png' };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn/new-logo.png');
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockOrganizationService.update.mockResolvedValue({});

      await controller.uploadLogo('org-1', mockFile);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn/old-logo.png');
    });

    it('should not attempt to delete if no previous logo', async () => {
      const org = { id: 'org-1', logoUrl: null };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn/logo.png');
      mockOrganizationService.update.mockResolvedValue({});

      await controller.uploadLogo('org-1', mockFile);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should not fail if old logo deletion fails (catch silently)', async () => {
      const org = { id: 'org-1', logoUrl: 'https://cdn/old.png' };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn/new.png');
      mockStorageService.deleteFile.mockRejectedValue(new Error('S3 error'));
      mockOrganizationService.update.mockResolvedValue({});

      const result = await controller.uploadLogo('org-1', mockFile);

      expect(result).toEqual({ url: 'https://cdn/new.png' });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.uploadLogo('org-1', undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException with correct message when file is missing', async () => {
      await expect(controller.uploadLogo('org-1', null as any)).rejects.toThrow(
        'Arquivo nao enviado',
      );
    });
  });

  // -----------------------------------------------------------
  // DELETE /organizations/:id/upload/logo
  // -----------------------------------------------------------
  describe('deleteLogo', () => {
    it('should delete logo from storage and set logoUrl to null', async () => {
      const org = { id: 'org-1', logoUrl: 'https://cdn/logo.png' };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockOrganizationService.update.mockResolvedValue({});

      const result = await controller.deleteLogo('org-1');

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn/logo.png');
      expect(mockOrganizationService.update).toHaveBeenCalledWith('org-1', { logoUrl: null });
      expect(result).toEqual({ success: true });
    });

    it('should skip storage delete if no logo exists', async () => {
      mockOrganizationService.findById.mockResolvedValue({ id: 'org-1', logoUrl: null });
      mockOrganizationService.update.mockResolvedValue({});

      const result = await controller.deleteLogo('org-1');

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors from findById', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockOrganizationService.findById.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(controller.deleteLogo('missing')).rejects.toThrow(NotFoundException);
    });

    it('should propagate errors from storage deleteFile', async () => {
      mockOrganizationService.findById.mockResolvedValue({
        id: 'org-1',
        logoUrl: 'https://cdn/logo.png',
      });
      mockStorageService.deleteFile.mockRejectedValue(new Error('Storage failure'));

      await expect(controller.deleteLogo('org-1')).rejects.toThrow('Storage failure');
    });
  });

  // -----------------------------------------------------------
  // DELETE /organizations/:id
  // -----------------------------------------------------------
  describe('delete', () => {
    it('should delegate to organizationService.delete', async () => {
      mockOrganizationService.delete.mockResolvedValue({ id: 'org-1' });

      const result = await controller.delete('org-1');

      expect(mockOrganizationService.delete).toHaveBeenCalledWith('org-1');
      expect(result).toEqual({ id: 'org-1' });
    });

    it('should propagate errors from service', async () => {
      mockOrganizationService.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.delete('org-1')).rejects.toThrow('Delete failed');
    });
  });

  // -----------------------------------------------------------
  // Security: Input validation at controller level
  // -----------------------------------------------------------
  describe('Security - Input validation', () => {
    it('should forward SQL injection-like name to service (DTO/pipe validation is the guard)', async () => {
      const maliciousDto = {
        name: "Robert'); DROP TABLE organizations;--",
        ownerId: 'uuid-1',
      };
      mockOrganizationService.create.mockResolvedValue({ id: 'org-1' });

      await controller.create(maliciousDto as any);

      expect(mockOrganizationService.create).toHaveBeenCalledWith(maliciousDto);
    });

    it('should forward XSS-like name to service', async () => {
      const xssDto = {
        name: '<img src=x onerror=alert(1)>',
        ownerId: 'uuid-1',
      };
      mockOrganizationService.create.mockResolvedValue({ id: 'org-1' });

      await controller.create(xssDto as any);

      expect(mockOrganizationService.create).toHaveBeenCalledWith(xssDto);
    });

    it('should handle path traversal in slug parameter', async () => {
      mockOrganizationService.findBySlug.mockResolvedValue(null);

      await controller.findBySlug('../../etc/passwd');

      expect(mockOrganizationService.findBySlug).toHaveBeenCalledWith('../../etc/passwd');
    });

    it('should handle excessively long IDs', async () => {
      const longId = 'a'.repeat(10000);
      mockOrganizationService.findById.mockResolvedValue(null);

      await controller.findById(longId);

      expect(mockOrganizationService.findById).toHaveBeenCalledWith(longId);
    });
  });

  // -----------------------------------------------------------
  // Security: Data leakage
  // -----------------------------------------------------------
  describe('Security - Data leakage', () => {
    it('findBySlug (public) should only return limited fields from service', async () => {
      const publicData = {
        id: 'org-1',
        name: 'Lavacar',
        slug: 'lavacar',
        logoUrl: 'https://cdn/logo.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockOrganizationService.findBySlug.mockResolvedValue(publicData);

      const result = await controller.findBySlug('lavacar');

      expect(result).toEqual(publicData);
      // The use case / repository should not include sensitive fields
      expect(result).not.toHaveProperty('document');
      expect(result).not.toHaveProperty('ownerId');
    });

    it('findById should not expose member passwords', async () => {
      const orgWithMembers = {
        id: 'org-1',
        name: 'Org',
        members: [
          {
            id: 'mem-1',
            user: {
              id: 'u1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@test.com',
              picture: null,
              // no password field
            },
          },
        ],
      };
      mockOrganizationService.findById.mockResolvedValue(orgWithMembers);

      const result = await controller.findById('org-1');

      expect(result.members[0].user).not.toHaveProperty('password');
      expect(result.members[0].user).not.toHaveProperty('passwordHash');
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('findAll should handle zero page', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('0', '10');

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({ page: 0, perPage: 10 });
    });

    it('findAll should handle negative page', async () => {
      mockOrganizationService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll('-1', '10');

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith({ page: -1, perPage: 10 });
    });

    it('findDashboardMetrics should handle all period values', async () => {
      const periods = ['7d', '30d', '90d', 'lifetime'];
      for (const period of periods) {
        mockOrganizationService.findDashboardMetrics.mockResolvedValue({});

        await controller.findDashboardMetrics('org-1', period as any, undefined, undefined);

        expect(mockOrganizationService.findDashboardMetrics).toHaveBeenCalledWith('org-1', {
          period,
          startDate: undefined,
          endDate: undefined,
        });
      }
    });

    it('uploadLogo should use organizationId from looked-up org, not param', async () => {
      const org = { id: 'real-org-id', logoUrl: null };
      mockOrganizationService.findById.mockResolvedValue(org);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn/logo.png');
      mockOrganizationService.update.mockResolvedValue({});

      const file = { buffer: Buffer.from('img'), mimetype: 'image/png' } as Express.Multer.File;

      await controller.uploadLogo('param-id', file);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            organizationId: 'real-org-id',
          }),
        }),
      );
    });
  });
});
