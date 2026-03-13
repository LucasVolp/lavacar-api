import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../organization.service';
import { CreateOrganizationUseCase } from '../use-cases/create-organization.use-case';
import { FindAllOrganizationUseCase } from '../use-cases/find-all-organization.use-case';
import { FindOrganizationByIdUseCase } from '../use-cases/find-organization-by-id.use-case';
import { UpdateOrganizationUseCase } from '../use-cases/update-organization.use-case';
import { DeleteOrganizationUseCase } from '../use-cases/delete-organization.use-case';
import { FindOrganizationByOwnerUseCase } from '../use-cases/find-organization-by-owner.use-case';
import { FindOrganizationDashboardMetricsUseCase } from '../use-cases/find-organization-dashboard-metrics.use-case';

const mockCreateOrganizationUseCase = { execute: jest.fn() };
const mockFindAllOrganizationUseCase = { execute: jest.fn() };
const mockFindOrganizationByIdUseCase = { execute: jest.fn(), executeBySlug: jest.fn() };
const mockUpdateOrganizationUseCase = { execute: jest.fn() };
const mockDeleteOrganizationUseCase = { execute: jest.fn() };
const mockFindOrganizationByOwnerUseCase = { execute: jest.fn() };
const mockFindOrganizationDashboardMetricsUseCase = { execute: jest.fn() };

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: CreateOrganizationUseCase, useValue: mockCreateOrganizationUseCase },
        { provide: FindAllOrganizationUseCase, useValue: mockFindAllOrganizationUseCase },
        { provide: FindOrganizationByIdUseCase, useValue: mockFindOrganizationByIdUseCase },
        { provide: UpdateOrganizationUseCase, useValue: mockUpdateOrganizationUseCase },
        { provide: DeleteOrganizationUseCase, useValue: mockDeleteOrganizationUseCase },
        { provide: FindOrganizationByOwnerUseCase, useValue: mockFindOrganizationByOwnerUseCase },
        { provide: FindOrganizationDashboardMetricsUseCase, useValue: mockFindOrganizationDashboardMetricsUseCase },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    const createDto = {
      name: 'Lavacar Central',
      document: '12345678000100',
      ownerId: 'owner-uuid-1',
    };

    it('should delegate to CreateOrganizationUseCase.execute', async () => {
      const created = { id: 'org-1', ...createDto };
      mockCreateOrganizationUseCase.execute.mockResolvedValue(created);

      const result = await service.create(createDto);

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(created);
    });

    it('should pass all DTO fields including optional ones', async () => {
      const fullDto = { ...createDto, logoUrl: 'https://cdn/logo.png' };
      mockCreateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1', ...fullDto });

      await service.create(fullDto);

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(fullDto);
    });

    it('should propagate BadRequestException for duplicate document', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockCreateOrganizationUseCase.execute.mockRejectedValue(
        new BadRequestException('Organization with this document already exists.'),
      );

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should propagate BadRequestException for non-existing owner', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockCreateOrganizationUseCase.execute.mockRejectedValue(
        new BadRequestException('Owner user does not exist.'),
      );

      await expect(service.create(createDto)).rejects.toThrow('Owner user does not exist.');
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      const { ServiceUnavailableException } = require('@nestjs/common');
      mockCreateOrganizationUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.create(createDto)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should delegate to FindAllOrganizationUseCase.execute with filters', async () => {
      const paginatedResult = {
        data: [{ id: 'org-1' }, { id: 'org-2' }],
        meta: { total: 2, page: 1, perPage: 10 },
      };
      mockFindAllOrganizationUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ page: 1, perPage: 10 });

      expect(mockFindAllOrganizationUseCase.execute).toHaveBeenCalledWith({ page: 1, perPage: 10 });
      expect(result).toEqual(paginatedResult);
    });

    it('should work without filters', async () => {
      const paginatedResult = { data: [], meta: { total: 0 } };
      mockFindAllOrganizationUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await service.findAll();

      expect(mockFindAllOrganizationUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass partial filters', async () => {
      mockFindAllOrganizationUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

      await service.findAll({ page: 2 });

      expect(mockFindAllOrganizationUseCase.execute).toHaveBeenCalledWith({ page: 2 });
    });

    it('should propagate errors from FindAllOrganizationUseCase', async () => {
      mockFindAllOrganizationUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  // -----------------------------------------------------------
  // findById
  // -----------------------------------------------------------
  describe('findById', () => {
    it('should delegate to FindOrganizationByIdUseCase.execute', async () => {
      const org = { id: 'org-1', name: 'Lavacar Central' };
      mockFindOrganizationByIdUseCase.execute.mockResolvedValue(org);

      const result = await service.findById('org-1');

      expect(mockFindOrganizationByIdUseCase.execute).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException when org not found', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockFindOrganizationByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      const { ServiceUnavailableException } = require('@nestjs/common');
      mockFindOrganizationByIdUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Error finding organization'),
      );

      await expect(service.findById('org-1')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findBySlug
  // -----------------------------------------------------------
  describe('findBySlug', () => {
    it('should delegate to FindOrganizationByIdUseCase.executeBySlug', async () => {
      const org = { id: 'org-1', slug: 'lavacar-central' };
      mockFindOrganizationByIdUseCase.executeBySlug.mockResolvedValue(org);

      const result = await service.findBySlug('lavacar-central');

      expect(mockFindOrganizationByIdUseCase.executeBySlug).toHaveBeenCalledWith('lavacar-central');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException when slug not found', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockFindOrganizationByIdUseCase.executeBySlug.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // findByOwner
  // -----------------------------------------------------------
  describe('findByOwner', () => {
    it('should delegate to FindOrganizationByOwnerUseCase.execute', async () => {
      const org = { id: 'org-1', ownerId: 'owner-1' };
      mockFindOrganizationByOwnerUseCase.execute.mockResolvedValue(org);

      const result = await service.findByOwner('owner-1');

      expect(mockFindOrganizationByOwnerUseCase.execute).toHaveBeenCalledWith('owner-1');
      expect(result).toEqual(org);
    });

    it('should propagate NotFoundException when no org found for owner', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockFindOrganizationByOwnerUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found'),
      );

      await expect(service.findByOwner('unknown-owner')).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      const { ServiceUnavailableException } = require('@nestjs/common');
      mockFindOrganizationByOwnerUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Unable to retrieve organization at this time'),
      );

      await expect(service.findByOwner('owner-1')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // findDashboardMetrics
  // -----------------------------------------------------------
  describe('findDashboardMetrics', () => {
    it('should delegate to FindOrganizationDashboardMetricsUseCase.execute with filters', async () => {
      const metrics = { totalRevenue: 5000, totalAppointments: 50 };
      mockFindOrganizationDashboardMetricsUseCase.execute.mockResolvedValue(metrics);

      const filters = { period: '30d' as const };
      const result = await service.findDashboardMetrics('org-1', filters);

      expect(mockFindOrganizationDashboardMetricsUseCase.execute).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual(metrics);
    });

    it('should use empty filters by default', async () => {
      const metrics = { totalRevenue: 0, totalAppointments: 0 };
      mockFindOrganizationDashboardMetricsUseCase.execute.mockResolvedValue(metrics);

      await service.findDashboardMetrics('org-1');

      expect(mockFindOrganizationDashboardMetricsUseCase.execute).toHaveBeenCalledWith('org-1', {});
    });

    it('should pass date range filters', async () => {
      mockFindOrganizationDashboardMetricsUseCase.execute.mockResolvedValue({});
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await service.findDashboardMetrics('org-1', { startDate, endDate });

      expect(mockFindOrganizationDashboardMetricsUseCase.execute).toHaveBeenCalledWith('org-1', {
        startDate,
        endDate,
      });
    });

    it('should propagate NotFoundException when org not found', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockFindOrganizationDashboardMetricsUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(service.findDashboardMetrics('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to UpdateOrganizationUseCase.execute', async () => {
      const updateDto = { name: 'Updated Org' };
      const updated = { id: 'org-1', name: 'Updated Org' };
      mockUpdateOrganizationUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('org-1', updateDto);

      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledWith('org-1', updateDto);
      expect(result).toEqual(updated);
    });

    it('should handle partial updates with only document', async () => {
      const updateDto = { document: '98765432000100' };
      mockUpdateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1', ...updateDto });

      await service.update('org-1', updateDto);

      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledWith('org-1', updateDto);
    });

    it('should handle isActive update', async () => {
      const updateDto = { isActive: false };
      mockUpdateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1', isActive: false });

      await service.update('org-1', updateDto);

      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledWith('org-1', { isActive: false });
    });

    it('should propagate NotFoundException when org not found', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockUpdateOrganizationUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for duplicate document', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockUpdateOrganizationUseCase.execute.mockRejectedValue(
        new BadRequestException('Organization with this document already exists'),
      );

      await expect(service.update('org-1', { document: 'dup' })).rejects.toThrow(BadRequestException);
    });

    it('should propagate BadRequestException for non-existing owner', async () => {
      const { BadRequestException } = require('@nestjs/common');
      mockUpdateOrganizationUseCase.execute.mockRejectedValue(
        new BadRequestException('Owner user does not exist.'),
      );

      await expect(service.update('org-1', { ownerId: 'bad-user' })).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------
  // delete
  // -----------------------------------------------------------
  describe('delete', () => {
    it('should delegate to DeleteOrganizationUseCase.execute', async () => {
      const deleted = { id: 'org-1', name: 'Deleted Org' };
      mockDeleteOrganizationUseCase.execute.mockResolvedValue(deleted);

      const result = await service.delete('org-1');

      expect(mockDeleteOrganizationUseCase.execute).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(deleted);
    });

    it('should propagate NotFoundException when org not found', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockDeleteOrganizationUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found.'),
      );

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      const { ServiceUnavailableException } = require('@nestjs/common');
      mockDeleteOrganizationUseCase.execute.mockRejectedValue(
        new ServiceUnavailableException('Something bad happened!'),
      );

      await expect(service.delete('org-1')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // -----------------------------------------------------------
  // Security: Multi-tenancy isolation
  // -----------------------------------------------------------
  describe('Security - Multi-tenancy isolation', () => {
    it('should only return organizations for the given owner ID', async () => {
      const org = { id: 'org-1', ownerId: 'owner-1', name: 'Owner 1 Org' };
      mockFindOrganizationByOwnerUseCase.execute.mockResolvedValue(org);

      const result = await service.findByOwner('owner-1');

      expect(mockFindOrganizationByOwnerUseCase.execute).toHaveBeenCalledWith('owner-1');
      expect(result.ownerId).toBe('owner-1');
    });

    it('should not leak data between organizations on findById', async () => {
      mockFindOrganizationByIdUseCase.execute.mockResolvedValue({
        id: 'org-1',
        ownerId: 'owner-1',
      });

      const result = await service.findById('org-1');

      expect(result.id).toBe('org-1');
      expect(mockFindOrganizationByIdUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should scope dashboard metrics to the specified organization', async () => {
      mockFindOrganizationDashboardMetricsUseCase.execute.mockResolvedValue({
        organizationId: 'org-1',
        totalRevenue: 1000,
      });

      await service.findDashboardMetrics('org-1', { period: '7d' as const });

      expect(mockFindOrganizationDashboardMetricsUseCase.execute).toHaveBeenCalledWith(
        'org-1',
        { period: '7d' },
      );
    });
  });

  // -----------------------------------------------------------
  // Security: Input validation / injection vectors
  // -----------------------------------------------------------
  describe('Security - Input validation', () => {
    it('should pass through SQL injection-like strings to use case (use case handles validation)', async () => {
      const maliciousDto = {
        name: "'; DROP TABLE organizations; --",
        ownerId: 'valid-uuid',
      };
      mockCreateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1', ...maliciousDto });

      await service.create(maliciousDto);

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(maliciousDto);
    });

    it('should pass XSS-like strings to use case layer (DTO validation guards)', async () => {
      const xssDto = {
        name: '<script>alert("xss")</script>',
        ownerId: 'valid-uuid',
      };
      mockCreateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1' });

      await service.create(xssDto);

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(xssDto);
    });

    it('should forward slug with special characters to use case', async () => {
      mockFindOrganizationByIdUseCase.executeBySlug.mockResolvedValue(null);

      await service.findBySlug('../../../etc/passwd');

      expect(mockFindOrganizationByIdUseCase.executeBySlug).toHaveBeenCalledWith('../../../etc/passwd');
    });

    it('should handle empty string id gracefully', async () => {
      const { NotFoundException } = require('@nestjs/common');
      mockFindOrganizationByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Organization not found!'),
      );

      await expect(service.findById('')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle create with minimal required fields', async () => {
      const minDto = { name: 'AB', ownerId: 'uuid-1' };
      mockCreateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1', ...minDto });

      const result = await service.create(minDto);

      expect(result).toBeDefined();
      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith(minDto);
    });

    it('should handle findAll returning empty results', async () => {
      mockFindAllOrganizationUseCase.execute.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, perPage: 10 },
      });

      const result = await service.findAll({ page: 1, perPage: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle update with empty DTO', async () => {
      mockUpdateOrganizationUseCase.execute.mockResolvedValue({ id: 'org-1' });

      await service.update('org-1', {});

      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledWith('org-1', {});
    });

    it('should call correct use case method for each service method', async () => {
      // Ensure no cross-calling between use cases
      mockCreateOrganizationUseCase.execute.mockResolvedValue({});
      mockFindAllOrganizationUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });
      mockFindOrganizationByIdUseCase.execute.mockResolvedValue({});
      mockFindOrganizationByIdUseCase.executeBySlug.mockResolvedValue({});
      mockFindOrganizationByOwnerUseCase.execute.mockResolvedValue({});
      mockFindOrganizationDashboardMetricsUseCase.execute.mockResolvedValue({});
      mockUpdateOrganizationUseCase.execute.mockResolvedValue({});
      mockDeleteOrganizationUseCase.execute.mockResolvedValue({});

      await service.create({ name: 'Test', ownerId: 'u1' });
      await service.findAll();
      await service.findById('id');
      await service.findBySlug('slug');
      await service.findByOwner('owner');
      await service.findDashboardMetrics('id');
      await service.update('id', {});
      await service.delete('id');

      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindAllOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindOrganizationByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindOrganizationByIdUseCase.executeBySlug).toHaveBeenCalledTimes(1);
      expect(mockFindOrganizationByOwnerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindOrganizationDashboardMetricsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteOrganizationUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
