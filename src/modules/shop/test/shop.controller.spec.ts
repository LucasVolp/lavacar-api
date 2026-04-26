import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ShopController } from '../shop.controller';
import { ShopService } from '../shop.service';
import { StorageService } from '../../storage/storage.service';
import { CanAccessShopGuard } from 'src/guards/can-access-shop.guard';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateShopDto } from '../dto/create-shop.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockShopService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findBySlug: jest.fn(),
};

const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511900000000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511900000001', role: 'OWNER' };

const sampleShop = {
  id: 'shop-1',
  name: 'Lava Car Centro',
  slug: 'lava-car-centro',
  organizationId: 'org-1',
  logoUrl: null,
  bannerUrl: null,
  gallery: [],
};

const buildMockFile = (overrides?: Partial<Express.Multer.File>): Express.Multer.File =>
  ({
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/png',
    originalname: 'logo.png',
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  }) as Express.Multer.File;

describe('ShopController', () => {
  let controller: ShopController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopController],
      providers: [
        { provide: ShopService, useValue: mockShopService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    })
      .overrideGuard(CanAccessShopGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ShopController>(ShopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =======================================================================
  // POST /shop  (create)
  // =======================================================================
  describe('create', () => {
    const createDto: CreateShopDto = {
      name: 'Shop A',
      phone: '+5511999999999',
      zipCode: '01001000',
      street: 'Rua X',
      number: '100',
      neighborhood: 'Centro',
      city: 'SP',
      state: 'SP',
      organizationId: 'org-1',
    };

    it('should delegate to shopService.create with dto and user', async () => {
      const created = { id: 'shop-1', ...createDto };
      mockShopService.create.mockResolvedValue(created);

      const result = await controller.create(createDto, adminUser);

      expect(mockShopService.create).toHaveBeenCalledWith(createDto, adminUser);
      expect(result).toEqual(created);
    });

    it('should propagate errors from shopService.create', async () => {
      mockShopService.create.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.create(createDto, adminUser)).rejects.toThrow('Forbidden');
    });

    it('should forward complete DTO including optional fields', async () => {
      const fullDto = {
        ...createDto,
        slug: 'my-shop',
        description: 'Awesome shop',
        email: 'shop@mail.com',
        document: '12345678000190',
      } as CreateShopDto;
      mockShopService.create.mockResolvedValue({ id: 'shop-2' });

      await controller.create(fullDto, ownerUser);

      expect(mockShopService.create).toHaveBeenCalledWith(fullDto, ownerUser);
    });
  });

  // =======================================================================
  // GET /shop  (findAll)
  // =======================================================================
  describe('findAll', () => {
    it('should pass parsed query params to shopService.findAll', () => {
      mockShopService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll('org-1', '1', '10');

      expect(mockShopService.findAll).toHaveBeenCalledWith({
        organizationId: 'org-1',
        page: 1,
        perPage: 10,
      });
    });

    it('should pass undefined for missing query params', () => {
      mockShopService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(undefined, undefined, undefined);

      expect(mockShopService.findAll).toHaveBeenCalledWith({
        organizationId: undefined,
        page: undefined,
        perPage: undefined,
      });
    });

    it('should correctly parse integer strings', () => {
      mockShopService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(undefined, '3', '25');

      expect(mockShopService.findAll).toHaveBeenCalledWith({
        organizationId: undefined,
        page: 3,
        perPage: 25,
      });
    });

    it('should result in NaN for non-numeric page strings', () => {
      mockShopService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      controller.findAll(undefined, 'abc', 'xyz');

      expect(mockShopService.findAll).toHaveBeenCalledWith({
        organizationId: undefined,
        page: NaN,
        perPage: NaN,
      });
    });

    it('should propagate errors from shopService.findAll', async () => {
      mockShopService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll()).rejects.toThrow('DB error');
    });
  });

  // =======================================================================
  // GET /shop/:id  (findOne)
  // =======================================================================
  describe('findOne', () => {
    it('should delegate to shopService.findOne', async () => {
      mockShopService.findOne.mockResolvedValue(sampleShop);

      const result = await controller.findOne('shop-1');

      expect(mockShopService.findOne).toHaveBeenCalledWith('shop-1');
      expect(result).toEqual(sampleShop);
    });

    it('should propagate not found errors', async () => {
      mockShopService.findOne.mockRejectedValue(new Error('Shop not found!'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow('Shop not found!');
    });
  });

  // =======================================================================
  // GET /shop/slug/:slug  (findBySlug) -- Public endpoint
  // =======================================================================
  describe('findBySlug', () => {
    it('should delegate to shopService.findBySlug', async () => {
      mockShopService.findBySlug.mockResolvedValue(sampleShop);

      const result = await controller.findBySlug('lava-car-centro');

      expect(mockShopService.findBySlug).toHaveBeenCalledWith('lava-car-centro');
      expect(result).toEqual(sampleShop);
    });

    it('should propagate errors when slug not found', async () => {
      mockShopService.findBySlug.mockRejectedValue(new Error('Shop not found!'));

      await expect(controller.findBySlug('nonexistent')).rejects.toThrow('Shop not found!');
    });
  });

  // =======================================================================
  // PATCH /shop/:id  (update)
  // =======================================================================
  describe('update', () => {
    it('should delegate to shopService.update', async () => {
      const updateDto = { name: 'Updated Name' } as any;
      const updated = { ...sampleShop, name: 'Updated Name' };
      mockShopService.update.mockResolvedValue(updated);

      const result = await controller.update('shop-1', updateDto);

      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', updateDto);
      expect(result).toEqual(updated);
    });

    it('should propagate errors from shopService.update', async () => {
      mockShopService.update.mockRejectedValue(new Error('Conflict'));

      await expect(controller.update('shop-1', {} as any)).rejects.toThrow('Conflict');
    });
  });

  // =======================================================================
  // DELETE /shop/:id  (remove)
  // =======================================================================
  describe('remove', () => {
    it('should delegate to shopService.remove with id and user', async () => {
      mockShopService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove('shop-1', adminUser);

      expect(mockShopService.remove).toHaveBeenCalledWith('shop-1', adminUser);
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate errors from shopService.remove', async () => {
      mockShopService.remove.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.remove('shop-1', ownerUser)).rejects.toThrow('Forbidden');
    });
  });

  // =======================================================================
  // POST /shop/:id/upload/logo  (uploadLogo)
  // =======================================================================
  describe('uploadLogo', () => {
    const mockFile = buildMockFile();

    it('should upload logo, update shop, and return url', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: null });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/logo.png');
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadLogo('shop-1', mockFile);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'logo' },
      });
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { logoUrl: 'https://cdn.example.com/logo.png' });
      expect(result).toEqual({ url: 'https://cdn.example.com/logo.png' });
    });

    it('should delete the old logo before uploading the new one', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: 'https://cdn.example.com/old-logo.png' });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new-logo.png');
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      await controller.uploadLogo('shop-1', mockFile);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/old-logo.png');
    });

    it('should not fail if deleting old logo throws (catch swallows error)', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: 'https://cdn.example.com/old.png' });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new.png');
      mockStorageService.deleteFile.mockRejectedValue(new Error('R2 error'));
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadLogo('shop-1', mockFile);

      expect(result).toEqual({ url: 'https://cdn.example.com/new.png' });
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.uploadLogo('shop-1', undefined as any)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadLogo('shop-1', undefined as any)).rejects.toThrow('Arquivo nao enviado');
    });

    it('should not skip upload if shop has no logoUrl', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: null });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/first.png');
      mockShopService.update.mockResolvedValue({});

      await controller.uploadLogo('shop-1', mockFile);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  // =======================================================================
  // DELETE /shop/:id/upload/logo  (deleteLogo)
  // =======================================================================
  describe('deleteLogo', () => {
    it('should delete the logo file from storage and set logoUrl to null', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: 'https://cdn.example.com/logo.png' });
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteLogo('shop-1');

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/logo.png');
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { logoUrl: null });
      expect(result).toEqual({ success: true });
    });

    it('should skip storage delete if no logo exists', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, logoUrl: null });
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteLogo('shop-1');

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  // =======================================================================
  // POST /shop/:id/upload/banner  (uploadBanner)
  // =======================================================================
  describe('uploadBanner', () => {
    const mockFile = buildMockFile({ originalname: 'banner.png' });

    it('should upload banner, update shop, and return url', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, bannerUrl: null });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/banner.png');
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadBanner('shop-1', mockFile);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'banner' },
      });
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { bannerUrl: 'https://cdn.example.com/banner.png' });
      expect(result).toEqual({ url: 'https://cdn.example.com/banner.png' });
    });

    it('should delete old banner before uploading a new one', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, bannerUrl: 'https://cdn.example.com/old-banner.png' });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new-banner.png');
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      await controller.uploadBanner('shop-1', mockFile);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/old-banner.png');
    });

    it('should not fail if old banner deletion throws', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, bannerUrl: 'https://cdn.example.com/old.png' });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/new.png');
      mockStorageService.deleteFile.mockRejectedValue(new Error('R2 error'));
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadBanner('shop-1', mockFile);

      expect(result).toEqual({ url: 'https://cdn.example.com/new.png' });
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.uploadBanner('shop-1', undefined as any)).rejects.toThrow(BadRequestException);
    });
  });

  // =======================================================================
  // DELETE /shop/:id/upload/banner  (deleteBanner)
  // =======================================================================
  describe('deleteBanner', () => {
    it('should delete the banner file from storage and set bannerUrl to null', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, bannerUrl: 'https://cdn.example.com/banner.png' });
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteBanner('shop-1');

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/banner.png');
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { bannerUrl: null });
      expect(result).toEqual({ success: true });
    });

    it('should skip storage delete if no banner exists', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, bannerUrl: null });
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteBanner('shop-1');

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  // =======================================================================
  // POST /shop/:id/upload/gallery  (uploadGallery)
  // =======================================================================
  describe('uploadGallery', () => {
    const mockFile = buildMockFile({ originalname: 'gallery1.png' });

    it('should upload gallery image and append to gallery array', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, gallery: ['https://cdn.example.com/img1.png'] });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/img2.png');
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadGallery('shop-1', mockFile);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'gallery' },
      });
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', {
        gallery: ['https://cdn.example.com/img1.png', 'https://cdn.example.com/img2.png'],
      });
      expect(result).toEqual({
        url: 'https://cdn.example.com/img2.png',
        gallery: ['https://cdn.example.com/img1.png', 'https://cdn.example.com/img2.png'],
      });
    });

    it('should handle null gallery (treat as empty array)', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, gallery: null });
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/first.png');
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadGallery('shop-1', mockFile);

      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', {
        gallery: ['https://cdn.example.com/first.png'],
      });
      expect(result).toEqual({
        url: 'https://cdn.example.com/first.png',
        gallery: ['https://cdn.example.com/first.png'],
      });
    });

    it('should deduplicate gallery urls (Set behavior)', async () => {
      const existingUrl = 'https://cdn.example.com/dup.png';
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, gallery: [existingUrl] });
      mockStorageService.uploadFile.mockResolvedValue(existingUrl);
      mockShopService.update.mockResolvedValue({});

      const result = await controller.uploadGallery('shop-1', mockFile);

      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', {
        gallery: [existingUrl],
      });
      expect(result.gallery).toHaveLength(1);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(controller.uploadGallery('shop-1', undefined as any)).rejects.toThrow(BadRequestException);
    });
  });

  // =======================================================================
  // DELETE /shop/:id/upload/gallery  (deleteGalleryImage)
  // =======================================================================
  describe('deleteGalleryImage', () => {
    it('should delete gallery image and return updated gallery', async () => {
      const urlToDelete = 'https://cdn.example.com/img2.png';
      mockShopService.findOne.mockResolvedValue({
        ...sampleShop,
        gallery: ['https://cdn.example.com/img1.png', urlToDelete],
      });
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteGalleryImage('shop-1', urlToDelete);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(urlToDelete);
      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', {
        gallery: ['https://cdn.example.com/img1.png'],
      });
      expect(result).toEqual({
        success: true,
        gallery: ['https://cdn.example.com/img1.png'],
      });
    });

    it('should throw BadRequestException if url query is not provided', async () => {
      await expect(controller.deleteGalleryImage('shop-1', undefined as any)).rejects.toThrow(BadRequestException);
      await expect(controller.deleteGalleryImage('shop-1', '')).rejects.toThrow(BadRequestException);
    });

    it('should handle gallery with null (treat as empty array)', async () => {
      mockShopService.findOne.mockResolvedValue({ ...sampleShop, gallery: null });
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockShopService.update.mockResolvedValue({});

      const result = await controller.deleteGalleryImage('shop-1', 'https://cdn.example.com/img.png');

      expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { gallery: [] });
      expect(result).toEqual({ success: true, gallery: [] });
    });
  });

  // =======================================================================
  // Security Tests
  // =======================================================================
  describe('Security', () => {
    describe('Slug injection via findBySlug', () => {
      it('should pass path-traversal slug to service for downstream handling', async () => {
        mockShopService.findBySlug.mockRejectedValue(new Error('Not found'));

        await expect(controller.findBySlug('../../../etc/passwd')).rejects.toThrow('Not found');
        expect(mockShopService.findBySlug).toHaveBeenCalledWith('../../../etc/passwd');
      });

      it('should pass script-tag slug to service', async () => {
        mockShopService.findBySlug.mockRejectedValue(new Error('Not found'));

        await expect(controller.findBySlug('<script>alert(1)</script>')).rejects.toThrow('Not found');
        expect(mockShopService.findBySlug).toHaveBeenCalledWith('<script>alert(1)</script>');
      });

      it('should pass SQL injection slug to service', async () => {
        mockShopService.findBySlug.mockRejectedValue(new Error('Not found'));

        await expect(controller.findBySlug("'; DROP TABLE shops; --")).rejects.toThrow('Not found');
      });

      it('should pass URL-encoded slug to service', async () => {
        mockShopService.findBySlug.mockRejectedValue(new Error('Not found'));

        await expect(controller.findBySlug('%00%0d%0a')).rejects.toThrow('Not found');
      });
    });

    describe('XSS in shop creation fields', () => {
      it('should forward XSS in name to service (DTO validation layer responsibility)', async () => {
        const xssDto = {
          name: '<img src=x onerror=alert(document.cookie)>',
          phone: '+5511999999999',
          zipCode: '01001000',
          street: 'Rua X',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
          organizationId: 'org-1',
        } as CreateShopDto;
        mockShopService.create.mockResolvedValue({ id: 'shop-x' });

        await controller.create(xssDto, adminUser);

        expect(mockShopService.create).toHaveBeenCalledWith(xssDto, adminUser);
      });

      it('should forward XSS in description via update', async () => {
        const dto = { description: '<svg/onload=alert(1)>' } as any;
        mockShopService.update.mockResolvedValue({ id: 'shop-1' });

        await controller.update('shop-1', dto);

        expect(mockShopService.update).toHaveBeenCalledWith('shop-1', dto);
      });

      it('should forward XSS in street/neighborhood/city via create', async () => {
        const xssDto = {
          name: 'Shop',
          phone: '+5511999999999',
          zipCode: '01001000',
          street: '"><script>alert(1)</script>',
          number: '1',
          neighborhood: 'javascript:alert(1)',
          city: '<iframe src="evil.com">',
          state: 'SP',
          organizationId: 'org-1',
        } as CreateShopDto;
        mockShopService.create.mockResolvedValue({ id: 'shop-y' });

        await controller.create(xssDto, adminUser);

        expect(mockShopService.create).toHaveBeenCalledWith(xssDto, adminUser);
      });
    });

    describe('Unauthorized shop creation enforcement', () => {
      it('should pass user context to service.create for authorization', async () => {
        const dto = {
          name: 'Unauthorized Shop',
          phone: '+5511999999999',
          zipCode: '01001000',
          street: 'Rua',
          number: '1',
          neighborhood: 'Bairro',
          city: 'SP',
          state: 'SP',
          organizationId: 'org-1',
        } as CreateShopDto;
        mockShopService.create.mockRejectedValue(new Error('Forbidden'));

        const user: JwtPayload = { id: 'random', email: '', phone: '', role: 'USER' };

        await expect(controller.create(dto, user)).rejects.toThrow('Forbidden');
        expect(mockShopService.create).toHaveBeenCalledWith(dto, user);
      });
    });

    describe('Upload security', () => {
      it('should throw BadRequestException for missing file on logo upload', async () => {
        await expect(controller.uploadLogo('shop-1', null as any)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for missing file on banner upload', async () => {
        await expect(controller.uploadBanner('shop-1', null as any)).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for missing file on gallery upload', async () => {
        await expect(controller.uploadGallery('shop-1', null as any)).rejects.toThrow(BadRequestException);
      });

      it('should propagate storage errors during logo upload', async () => {
        mockShopService.findOne.mockResolvedValue(sampleShop);
        mockStorageService.uploadFile.mockRejectedValue(new Error('Storage unavailable'));

        await expect(controller.uploadLogo('shop-1', buildMockFile())).rejects.toThrow('Storage unavailable');
      });

      it('should propagate shop-not-found errors during upload', async () => {
        mockShopService.findOne.mockRejectedValue(new Error('Shop not found!'));

        await expect(controller.uploadLogo('nonexistent', buildMockFile())).rejects.toThrow('Shop not found!');
      });
    });

    describe('IDOR prevention via ID parameter', () => {
      it('findOne passes the raw id to service (service enforces access)', async () => {
        mockShopService.findOne.mockResolvedValue(sampleShop);

        await controller.findOne('shop-1');

        expect(mockShopService.findOne).toHaveBeenCalledWith('shop-1');
      });

      it('remove passes both id and user to service for ownership check', async () => {
        mockShopService.remove.mockResolvedValue({ deleted: true });

        await controller.remove('shop-1', ownerUser);

        expect(mockShopService.remove).toHaveBeenCalledWith('shop-1', ownerUser);
      });

      it('update passes the raw id (service/use-case enforces existence)', async () => {
        mockShopService.update.mockResolvedValue({ id: 'shop-1' });

        await controller.update('shop-1', { name: 'New' } as any);

        expect(mockShopService.update).toHaveBeenCalledWith('shop-1', { name: 'New' });
      });
    });
  });
});
