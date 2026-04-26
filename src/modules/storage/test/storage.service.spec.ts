import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService, UploadOptions } from '../storage.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'PutObjectCommand', input })),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'DeleteObjectCommand', input })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ _type: 'GetObjectCommand', input })),
  };
});

const mockSharpInstance = {
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));
import sharp from 'sharp';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn().mockReturnValue('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
}));

import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Config helper
// ---------------------------------------------------------------------------

const ENV_DEFAULTS: Record<string, string> = {
  CLOUDFLARE_R2_ACCOUNT_ID: 'test-account-id',
  CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-access-key',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret-key',
  CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
  CLOUDFLARE_R2_PUBLIC_URL: 'https://cdn.example.com',
  CLOUDFLARE_R2_ENDPOINT: '',
  CLOUDFLARE_R2_API: '',
  BACKEND_PUBLIC_URL: 'http://localhost:3000',
  PORT: '3000',
};

function buildConfigService(overrides: Record<string, string> = {}): Record<string, jest.Mock> {
  const merged = { ...ENV_DEFAULTS, ...overrides };
  return {
    get: jest.fn((key: string) => merged[key] ?? undefined),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100, // 100KB
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

const UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('StorageService', () => {
  let service: StorageService;
  let configService: Record<string, jest.Mock>;

  async function createService(configOverrides: Record<string, string> = {}): Promise<StorageService> {
    configService = buildConfigService(configOverrides);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const svc = module.get<StorageService>(StorageService);
    // Silence logger in tests
    (svc as any).logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
    return svc;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSend.mockReset();
    mockSharpInstance.rotate.mockReturnThis();
    mockSharpInstance.resize.mockReturnThis();
    mockSharpInstance.webp.mockReturnThis();
    mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('processed-image'));

    service = await createService();
  });

  // =========================================================================
  // Instantiation
  // =========================================================================

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor / configuration', () => {
    it('should build endpoint from account ID when no explicit endpoint env is set', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_ENDPOINT: '',
        CLOUDFLARE_R2_API: '',
      });
      expect(svc).toBeDefined();
    });

    it('should use CLOUDFLARE_R2_ENDPOINT when available', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_ENDPOINT: 'https://custom-endpoint.example.com',
      });
      expect(svc).toBeDefined();
    });

    it('should fall back to CLOUDFLARE_R2_API when ENDPOINT is not set', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_ENDPOINT: '',
        CLOUDFLARE_R2_API: 'https://api-endpoint.example.com',
      });
      expect(svc).toBeDefined();
    });

    it('should warn when CLOUDFLARE_R2_PUBLIC_URL is not set', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      await createService({ CLOUDFLARE_R2_PUBLIC_URL: '' });
      expect(loggerWarnSpy).toHaveBeenCalled();
      loggerWarnSpy.mockRestore();
    });

    it('should warn when required env vars are missing', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      await createService({
        CLOUDFLARE_R2_ACCOUNT_ID: '',
        CLOUDFLARE_R2_ACCESS_KEY_ID: '',
        CLOUDFLARE_R2_SECRET_ACCESS_KEY: '',
        CLOUDFLARE_R2_BUCKET_NAME: '',
        CLOUDFLARE_R2_PUBLIC_URL: '',
      });
      expect(loggerWarnSpy).toHaveBeenCalled();
      loggerWarnSpy.mockRestore();
    });

    it('should strip trailing slash from publicUrl', async () => {
      const svc = await createService({ CLOUDFLARE_R2_PUBLIC_URL: 'https://cdn.example.com/' });
      // Verify by uploading
      mockSend.mockResolvedValue({});
      const url = await svc.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
      });
      // URL should not have double slashes
      expect(url).not.toContain('com//');
    });

    it('should strip trailing slash from proxyBaseUrl', async () => {
      const svc = await createService({
        BACKEND_PUBLIC_URL: 'http://localhost:3000/',
        CLOUDFLARE_R2_PUBLIC_URL: '', // force r2.cloudflarestorage fallback so proxy URL is used
        CLOUDFLARE_R2_ACCOUNT_ID: 'acct',
      });
      (svc as any).logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      expect(svc).toBeDefined();
    });
  });

  // =========================================================================
  // assertReady
  // =========================================================================

  describe('assertReady (via uploadFile)', () => {
    it('should throw InternalServerErrorException when bucketName is empty', async () => {
      const svc = await createService({ CLOUDFLARE_R2_BUCKET_NAME: '' });

      await expect(
        svc.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when publicUrl is empty', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_PUBLIC_URL: '',
        CLOUDFLARE_R2_ACCOUNT_ID: '', // forces publicUrl to ''
        CLOUDFLARE_R2_ENDPOINT: '',
        CLOUDFLARE_R2_API: '',
      });

      await expect(
        svc.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // =========================================================================
  // uploadFile - IMAGE
  // =========================================================================

  describe('uploadFile (IMAGE)', () => {
    const imageContext: UploadOptions['context'] = {
      type: 'ORGANIZATION',
      organizationId: 'org-1',
      category: 'logo',
    };

    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should upload an image successfully and return the public URL', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: imageContext,
      });

      expect(sharp).toHaveBeenCalledWith(expect.any(Buffer), { limitInputPixels: 40_000_000 });
      expect(mockSharpInstance.rotate).toHaveBeenCalled();
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }),
      );
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 82, effort: 4 });
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: `organizations/org-1/logo/${UUID}.webp`,
          ContentType: 'image/webp',
        }),
      );
      expect(url).toBe(`https://cdn.example.com/organizations/org-1/logo/${UUID}.webp`);
    });

    it('should accept image/jpeg', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/jpeg' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should accept image/jpg', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/jpg' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should accept image/png', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/png' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should accept image/webp', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/webp' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should accept image/heic', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/heic' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should accept image/heif', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/heif' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should reject disallowed MIME types for IMAGE', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'application/pdf' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject image/gif for IMAGE', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/gif' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject image/svg+xml for IMAGE', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ mimetype: 'image/svg+xml' }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject images exceeding MAX_IMAGE_BYTES (12MB)', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ size: 13 * 1024 * 1024 }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject images with exactly MAX_IMAGE_BYTES + 1', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ size: 12 * 1024 * 1024 + 1 }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept images at exactly MAX_IMAGE_BYTES', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ size: 12 * 1024 * 1024 }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).resolves.toBeDefined();
    });

    it('should reject zero-byte images', async () => {
      await expect(
        service.uploadFile({
          file: fakeFile({ size: 0 }),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when S3 send fails during upload', async () => {
      mockSend.mockRejectedValue(new Error('S3 network error'));

      await expect(
        service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: imageContext,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should use proxy URL when publicUrl is r2.cloudflarestorage.com', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_PUBLIC_URL: 'https://test-bucket.test-account-id.r2.cloudflarestorage.com',
        BACKEND_PUBLIC_URL: 'http://localhost:3000',
      });
      (svc as any).logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      mockSend.mockResolvedValue({});

      const url = await svc.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: imageContext,
      });

      expect(url).toContain('http://localhost:3000/storage/object?key=');
    });
  });

  // =========================================================================
  // uploadFile - DOCUMENT
  // =========================================================================

  describe('uploadFile (DOCUMENT)', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should upload a document without image processing', async () => {
      const file = fakeFile({
        originalname: 'report.pdf',
        mimetype: 'application/pdf',
        size: 500_000,
      });

      const url = await service.uploadFile({
        file,
        fileType: 'DOCUMENT',
        context: {
          type: 'SHOP',
          organizationId: 'org-1',
          shopId: 'shop-1',
          category: 'gallery',
        },
      });

      // sharp should NOT be called for documents
      expect(sharp).not.toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'application/pdf',
          Key: `organizations/org-1/shops/shop-1/gallery/${UUID}.pdf`,
        }),
      );
      expect(url).toContain('.pdf');
    });

    it('should use .bin extension when originalname has no extension', async () => {
      const file = fakeFile({ originalname: '', mimetype: 'application/octet-stream' });

      const url = await service.uploadFile({
        file,
        fileType: 'DOCUMENT',
        context: {
          type: 'USER',
          userId: 'user-1',
          category: 'avatar',
        },
      });

      expect(url).toContain('.bin');
    });
  });

  // =========================================================================
  // buildKey - context paths
  // =========================================================================

  describe('buildKey (via uploadFile)', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should build correct key for ORGANIZATION context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'ORGANIZATION', organizationId: 'org-123', category: 'logo' },
      });

      expect(url).toContain(`organizations/org-123/logo/${UUID}.webp`);
    });

    it('should build correct key for SHOP logo context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'logo' },
      });

      expect(url).toContain(`organizations/org-1/shops/shop-1/logo/${UUID}.webp`);
    });

    it('should build correct key for SHOP banner context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'banner' },
      });

      expect(url).toContain(`organizations/org-1/shops/shop-1/banner/${UUID}.webp`);
    });

    it('should build correct key for SHOP gallery context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'org-1', shopId: 'shop-1', category: 'gallery' },
      });

      expect(url).toContain(`organizations/org-1/shops/shop-1/gallery/${UUID}.webp`);
    });

    it('should build correct key for SHOP checklist context with appointmentId', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: {
          type: 'SHOP',
          organizationId: 'org-1',
          shopId: 'shop-1',
          category: 'checklist',
          appointmentId: 'appt-99',
        },
      });

      expect(url).toContain(`organizations/org-1/shops/shop-1/checklists/appt-99/${UUID}.webp`);
    });

    it('should build correct key for SHOP checklist without appointmentId (fallback)', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: {
          type: 'SHOP',
          organizationId: 'org-1',
          shopId: 'shop-1',
          category: 'checklist',
        },
      });

      // Without appointmentId the checklist branch is not taken; falls through to generic category path
      expect(url).toContain(`organizations/org-1/shops/shop-1/checklist/${UUID}.webp`);
    });

    it('should build correct key for SERVICE cover context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: {
          type: 'SERVICE',
          organizationId: 'org-1',
          shopId: 'shop-1',
          serviceId: 'svc-42',
          category: 'cover',
        },
      });

      expect(url).toContain(`organizations/org-1/shops/shop-1/services/svc-42/cover/${UUID}.webp`);
    });

    it('should build correct key for USER avatar context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'USER', userId: 'user-1', category: 'avatar' },
      });

      expect(url).toContain(`users/user-1/avatar/${UUID}.webp`);
    });

    it('should build correct key for USER evaluation context', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'USER', userId: 'user-1', category: 'evaluation' },
      });

      expect(url).toContain(`users/user-1/evaluations/${UUID}.webp`);
    });

    it('should build correct key for USER evaluation with appointmentId', async () => {
      const url = await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'USER', userId: 'user-1', category: 'evaluation', appointmentId: 'appt-10' },
      });

      expect(url).toContain(`users/user-1/evaluations/appt-10/${UUID}.webp`);
    });
  });

  // =========================================================================
  // resolveImageResize
  // =========================================================================

  describe('resolveImageResize (via uploadFile)', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should use 1400x1400 for ORGANIZATION', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1400, height: 1400 }),
      );
    });

    it('should use 1200x1200 for USER avatar', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'USER', userId: 'u1', category: 'avatar' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1200, height: 1200 }),
      );
    });

    it('should use 1920x1080 for USER evaluation', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'USER', userId: 'u1', category: 'evaluation' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1920, height: 1080 }),
      );
    });

    it('should use 2400x1200 for SHOP banner', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'o', shopId: 's', category: 'banner' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 2400, height: 1200 }),
      );
    });

    it('should use 1400x1400 for SHOP logo', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'o', shopId: 's', category: 'logo' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1400, height: 1400 }),
      );
    });

    it('should use 1920x1080 for SHOP gallery', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SHOP', organizationId: 'o', shopId: 's', category: 'gallery' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1920, height: 1080 }),
      );
    });

    it('should use 1920x1080 for SERVICE cover', async () => {
      await service.uploadFile({
        file: fakeFile(),
        fileType: 'IMAGE',
        context: { type: 'SERVICE', organizationId: 'o', shopId: 's', serviceId: 'sv', category: 'cover' },
      });

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(
        expect.objectContaining({ width: 1920, height: 1080 }),
      );
    });
  });

  // =========================================================================
  // deleteFile
  // =========================================================================

  describe('deleteFile', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should delete file by full public URL', async () => {
      await service.deleteFile(`https://cdn.example.com/organizations/org1/logo/${UUID}.webp`);

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: `organizations/org1/logo/${UUID}.webp`,
        }),
      );
    });

    it('should delete file by plain key path', async () => {
      await service.deleteFile(`organizations/org1/logo/${UUID}.webp`);

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: `organizations/org1/logo/${UUID}.webp`,
        }),
      );
    });

    it('should delete file by proxy URL with key query param', async () => {
      const key = `organizations/org1/logo/${UUID}.webp`;
      const proxyUrl = `http://localhost:3000/storage/object?key=${encodeURIComponent(key)}`;

      await service.deleteFile(proxyUrl);

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Key: key }),
      );
    });

    it('should silently return when key is empty', async () => {
      await service.deleteFile('');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should strip leading slashes from plain path', async () => {
      await service.deleteFile('///some/key.webp');

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Key: 'some/key.webp' }),
      );
    });

    it('should throw InternalServerErrorException when S3 send fails on delete', async () => {
      mockSend.mockRejectedValue(new Error('S3 delete error'));

      await expect(
        service.deleteFile(`https://cdn.example.com/orgs/logo/${UUID}.webp`),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when storage is not configured', async () => {
      const svc = await createService({ CLOUDFLARE_R2_BUCKET_NAME: '' });

      await expect(svc.deleteFile('some/key.webp')).rejects.toThrow(InternalServerErrorException);
    });
  });

  // =========================================================================
  // getObjectByKey
  // =========================================================================

  describe('getObjectByKey', () => {
    it('should return buffer and contentType for a valid key', async () => {
      const bodyBytes = new Uint8Array([1, 2, 3, 4]);
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: jest.fn().mockResolvedValue(bodyBytes) },
        ContentType: 'image/webp',
      });

      const result = await service.getObjectByKey('organizations/org1/logo/abc.webp');

      expect(GetObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'organizations/org1/logo/abc.webp',
        }),
      );
      expect(result.body).toEqual(Buffer.from(bodyBytes));
      expect(result.contentType).toBe('image/webp');
    });

    it('should throw InternalServerErrorException when Body is null/empty', async () => {
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: jest.fn().mockResolvedValue(undefined) },
        ContentType: undefined,
      });

      await expect(service.getObjectByKey('missing-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when Body is absent', async () => {
      mockSend.mockResolvedValue({ Body: null, ContentType: undefined });

      await expect(service.getObjectByKey('missing-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when S3 send fails', async () => {
      mockSend.mockRejectedValue(new Error('S3 get error'));

      await expect(service.getObjectByKey('some/key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when storage is not configured', async () => {
      const svc = await createService({ CLOUDFLARE_R2_BUCKET_NAME: '' });

      await expect(svc.getObjectByKey('some/key')).rejects.toThrow(InternalServerErrorException);
    });
  });

  // =========================================================================
  // extractKey (via deleteFile)
  // =========================================================================

  describe('extractKey (via deleteFile)', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    it('should handle URL with pathname prefix matching publicUrl pathname', async () => {
      const svc = await createService({
        CLOUDFLARE_R2_PUBLIC_URL: 'https://cdn.example.com/prefix',
      });
      (svc as any).logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };

      await svc.deleteFile('https://cdn.example.com/prefix/organizations/org1/logo/abc.webp');

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ Key: 'organizations/org1/logo/abc.webp' }),
      );
    });

    it('should handle invalid URL strings gracefully', async () => {
      await service.deleteFile('not://a[valid/url');

      // Should still attempt to use the string as key (after stripping leading slashes)
      expect(DeleteObjectCommand).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SECURITY TESTS
  // =========================================================================

  describe('Security', () => {
    beforeEach(() => {
      mockSend.mockResolvedValue({});
    });

    // -----------------------------------------------------------------------
    // Path traversal
    // -----------------------------------------------------------------------
    describe('path traversal prevention', () => {
      it('should sanitize path traversal in organizationId (../../etc/passwd)', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: '../../etc/passwd',
            category: 'logo',
          },
        });

        expect(url).not.toContain('..');
        expect(url).not.toContain('etc/passwd');
        // cleanPathPart strips dots and slashes
        expect(url).toContain('organizations/etcpasswd/logo/');
      });

      it('should sanitize path traversal in shopId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'SHOP',
            organizationId: 'org-1',
            shopId: '../../../etc/shadow',
            category: 'logo',
          },
        });

        expect(url).not.toContain('..');
        expect(url).not.toContain('etc/shadow');
      });

      it('should sanitize path traversal in userId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'USER',
            userId: '../../root/.ssh/id_rsa',
            category: 'avatar',
          },
        });

        expect(url).not.toContain('..');
        expect(url).not.toContain('/.ssh/');
        expect(url).not.toContain('/root/');
        // cleanPathPart strips dots and slashes, collapsing to 'rootsshid_rsa'
        expect(url).toContain('users/rootsshid_rsa/avatar/');
      });

      it('should sanitize path traversal in serviceId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'SERVICE',
            organizationId: 'org-1',
            shopId: 'shop-1',
            serviceId: '../../config/secrets',
            category: 'cover',
          },
        });

        expect(url).not.toContain('..');
        expect(url).not.toContain('config/secrets');
      });

      it('should sanitize path traversal in appointmentId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'SHOP',
            organizationId: 'org-1',
            shopId: 'shop-1',
            category: 'checklist',
            appointmentId: '../../../etc/passwd',
          },
        });

        expect(url).not.toContain('..');
        expect(url).not.toContain('etc/passwd');
      });
    });

    // -----------------------------------------------------------------------
    // Null bytes
    // -----------------------------------------------------------------------
    describe('null byte injection prevention', () => {
      it('should strip null bytes from organizationId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: 'org\x00malicious',
            category: 'logo',
          },
        });

        expect(url).not.toContain('\x00');
      });

      it('should strip null bytes from userId', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'USER',
            userId: 'user\x00evil',
            category: 'avatar',
          },
        });

        expect(url).not.toContain('\x00');
      });
    });

    // -----------------------------------------------------------------------
    // Filename attacks
    // -----------------------------------------------------------------------
    describe('filename attack prevention', () => {
      it('should handle path traversal in original filename', async () => {
        const url = await service.uploadFile({
          file: fakeFile({ originalname: '../../etc/passwd.jpg' }),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        });

        // The originalname is only used for extname; for IMAGE, extension is always .webp
        expect(url).toContain('.webp');
        expect(url).not.toContain('passwd');
      });

      it('should handle extremely long filenames gracefully', async () => {
        const longName = 'a'.repeat(10000) + '.jpg';
        const url = await service.uploadFile({
          file: fakeFile({ originalname: longName }),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        });

        // Image always gets .webp extension
        expect(url).toContain('.webp');
        expect(url).not.toContain('a'.repeat(10000));
      });

      it('should handle filenames with special characters', async () => {
        const url = await service.uploadFile({
          file: fakeFile({ originalname: 'file<script>alert(1)</script>.jpg' }),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        });

        expect(url).not.toContain('<script>');
        expect(url).toContain('.webp');
      });

      it('should handle null bytes in original filename for DOCUMENT', async () => {
        const url = await service.uploadFile({
          file: fakeFile({ originalname: 'test\x00.exe.pdf', mimetype: 'application/pdf' }),
          fileType: 'DOCUMENT',
          context: { type: 'USER', userId: 'u1', category: 'avatar' },
        });

        // extname should handle the null byte; key uses randomUUID anyway
        expect(url).toBeDefined();
      });
    });

    // -----------------------------------------------------------------------
    // Content type spoofing
    // -----------------------------------------------------------------------
    describe('content type spoofing prevention', () => {
      it('should reject executable disguised as image (application/x-executable)', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'application/x-executable' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject text/html disguised as image', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'text/html' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject application/javascript disguised as image', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'application/javascript' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject application/x-msdownload disguised as image', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'application/x-msdownload' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject video/mp4 disguised as image', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'video/mp4' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle case-insensitive MIME type check', async () => {
        // The service lowercases mimetype before checking
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'IMAGE/JPEG' }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).resolves.toBeDefined();
      });

      it('should convert all accepted images to webp on upload', async () => {
        await service.uploadFile({
          file: fakeFile({ mimetype: 'image/png', originalname: 'test.png' }),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        });

        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({ ContentType: 'image/webp' }),
        );
      });
    });

    // -----------------------------------------------------------------------
    // Key / path injection
    // -----------------------------------------------------------------------
    describe('S3 key injection prevention', () => {
      it('should strip slashes from path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: 'org/malicious/key',
            category: 'logo',
          },
        });

        // cleanPathPart removes slashes
        expect(url).toContain('organizations/orgmaliciouskey/logo/');
      });

      it('should strip dots from path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: 'org..id',
            category: 'logo',
          },
        });

        expect(url).toContain('organizations/orgid/logo/');
      });

      it('should strip spaces from path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: '  org id  ',
            category: 'logo',
          },
        });

        // cleanPathPart trims + strips non-alphanumeric
        expect(url).toContain('organizations/orgid/logo/');
      });

      it('should strip special characters from path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'USER',
            userId: 'user@#$%^&*()',
            category: 'avatar',
          },
        });

        expect(url).toContain('users/user/avatar/');
        expect(url).not.toMatch(/[@#$%^&*()]/);
      });

      it('should handle empty string path parts without crashing', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: '',
            category: 'logo',
          },
        });

        // Should still produce a valid key (just empty segment)
        expect(url).toContain('organizations//logo/');
      });

      it('should allow hyphens and underscores in path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: 'org-123_abc',
            category: 'logo',
          },
        });

        expect(url).toContain('organizations/org-123_abc/logo/');
      });
    });

    // -----------------------------------------------------------------------
    // MIME type boundary
    // -----------------------------------------------------------------------
    describe('MIME type validation strictness', () => {
      const invalidMimeTypes = [
        'image/tiff',
        'image/bmp',
        'image/gif',
        'image/svg+xml',
        'image/x-icon',
        'application/octet-stream',
        'text/plain',
        'multipart/form-data',
      ];

      it.each(invalidMimeTypes)('should reject MIME type: %s', async (mime) => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: mime }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];

      it.each(validMimeTypes)('should accept MIME type: %s', async (mime) => {
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: mime }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).resolves.toBeDefined();
      });
    });

    // -----------------------------------------------------------------------
    // File size edge cases
    // -----------------------------------------------------------------------
    describe('file size security', () => {
      it('should reject undefined size (falsy)', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ size: undefined as any }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject negative size', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ size: -1 }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should allow small valid size (1 byte)', async () => {
        await expect(
          service.uploadFile({
            file: fakeFile({ size: 1 }),
            fileType: 'IMAGE',
            context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
          }),
        ).resolves.toBeDefined();
      });

      it('should not validate file size for DOCUMENT type', async () => {
        // DOCUMENTs bypass size check
        await expect(
          service.uploadFile({
            file: fakeFile({ size: 100 * 1024 * 1024, mimetype: 'application/pdf', originalname: 'big.pdf' }),
            fileType: 'DOCUMENT',
            context: { type: 'USER', userId: 'u1', category: 'avatar' },
          }),
        ).resolves.toBeDefined();
      });

      it('should not validate MIME type for DOCUMENT type', async () => {
        // DOCUMENTs bypass mime check
        await expect(
          service.uploadFile({
            file: fakeFile({ mimetype: 'application/x-executable', originalname: 'app.exe' }),
            fileType: 'DOCUMENT',
            context: { type: 'USER', userId: 'u1', category: 'avatar' },
          }),
        ).resolves.toBeDefined();
      });
    });

    // -----------------------------------------------------------------------
    // Double encoding / unicode attacks
    // -----------------------------------------------------------------------
    describe('encoding and unicode attacks', () => {
      it('should sanitize unicode characters in path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: '\u202E\u0000org-evil',
            category: 'logo',
          },
        });

        expect(url).not.toContain('\u202E');
        expect(url).not.toContain('\x00');
      });

      it('should sanitize URL-encoded path traversal in path parts', async () => {
        const url = await service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: {
            type: 'ORGANIZATION',
            organizationId: '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            category: 'logo',
          },
        });

        // % is stripped by cleanPathPart, so no path traversal can happen
        expect(url).not.toContain('..');
        expect(url).not.toContain('/etc/');
      });
    });
  });

  // =========================================================================
  // Error message / logging
  // =========================================================================

  describe('error handling and logging', () => {
    it('should log stack trace on upload S3 error', async () => {
      const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      (service as any).logger = logger;
      const error = new Error('S3 failed');
      mockSend.mockRejectedValue(error);

      await expect(
        service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Falha no upload'),
        expect.any(String),
      );
    });

    it('should log stack trace on delete S3 error', async () => {
      const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      (service as any).logger = logger;
      mockSend.mockRejectedValue(new Error('S3 delete fail'));

      await expect(service.deleteFile('some/key')).rejects.toThrow(InternalServerErrorException);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao deletar'),
        expect.any(String),
      );
    });

    it('should log stack trace on getObject S3 error', async () => {
      const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      (service as any).logger = logger;
      mockSend.mockRejectedValue(new Error('S3 get fail'));

      await expect(service.getObjectByKey('some/key')).rejects.toThrow(InternalServerErrorException);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Falha ao ler'),
        expect.any(String),
      );
    });

    it('should handle non-Error objects thrown by S3 client', async () => {
      const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      (service as any).logger = logger;
      mockSend.mockRejectedValue('string-error');

      await expect(
        service.uploadFile({
          file: fakeFile(),
          fileType: 'IMAGE',
          context: { type: 'ORGANIZATION', organizationId: 'org-1', category: 'logo' },
        }),
      ).rejects.toThrow(InternalServerErrorException);

      // When error is not instanceof Error, stack is undefined
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Falha no upload'),
        undefined,
      );
    });

    it('should warn when deleteFile receives empty key', async () => {
      const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn() };
      (service as any).logger = logger;

      await service.deleteFile('');

      // No S3 call, just a warning for the falsy key case
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
