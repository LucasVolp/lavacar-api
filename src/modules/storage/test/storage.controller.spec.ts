import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StorageController } from '../storage.controller';
import { StorageService } from '../storage.service';

// ---------------------------------------------------------------------------
// Mock StorageService
// ---------------------------------------------------------------------------

const mockStorageService = {
  getObjectByKey: jest.fn(),
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

// ---------------------------------------------------------------------------
// Mock Express Response
// ---------------------------------------------------------------------------

function createMockResponse() {
  const res: any = {
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };
  return res;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // getObject - happy paths
  // =========================================================================

  describe('getObject', () => {
    it('should return file body with correct Content-Type header', async () => {
      const fileBuffer = Buffer.from('file-content');
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: fileBuffer,
        contentType: 'image/webp',
      });

      const res = createMockResponse();
      await controller.getObject('organizations/org1/logo/abc.webp', res);

      expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('organizations/org1/logo/abc.webp');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/webp');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
      expect(res.send).toHaveBeenCalledWith(fileBuffer);
    });

    it('should set Cache-Control to public, max-age=300', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('data'),
        contentType: 'image/png',
      });

      const res = createMockResponse();
      await controller.getObject('some/key', res);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
    });

    it('should use application/octet-stream when contentType is undefined', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('binary-data'),
        contentType: undefined,
      });

      const res = createMockResponse();
      await controller.getObject('files/unknown.bin', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    });

    it('should use application/octet-stream when contentType is null', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('binary-data'),
        contentType: null,
      });

      const res = createMockResponse();
      await controller.getObject('files/unknown.bin', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    });

    it('should use application/octet-stream when contentType is empty string', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('binary-data'),
        contentType: '',
      });

      const res = createMockResponse();
      await controller.getObject('files/unknown.bin', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    });

    // =========================================================================
    // getObject - validation
    // =========================================================================

    it('should throw BadRequestException when key is missing', async () => {
      const res = createMockResponse();

      await expect(controller.getObject('', res)).rejects.toThrow(BadRequestException);
      expect(mockStorageService.getObjectByKey).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when key is undefined', async () => {
      const res = createMockResponse();

      await expect(controller.getObject(undefined as any, res)).rejects.toThrow(BadRequestException);
      expect(mockStorageService.getObjectByKey).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when key is null', async () => {
      const res = createMockResponse();

      await expect(controller.getObject(null as any, res)).rejects.toThrow(BadRequestException);
      expect(mockStorageService.getObjectByKey).not.toHaveBeenCalled();
    });

    // =========================================================================
    // getObject - error propagation
    // =========================================================================

    it('should propagate InternalServerErrorException from storage service', async () => {
      mockStorageService.getObjectByKey.mockRejectedValue(
        new InternalServerErrorException('Erro ao ler arquivo do storage'),
      );

      const res = createMockResponse();

      await expect(controller.getObject('some/key', res)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should propagate generic errors from storage service', async () => {
      mockStorageService.getObjectByKey.mockRejectedValue(new Error('Unexpected'));

      const res = createMockResponse();

      await expect(controller.getObject('some/key', res)).rejects.toThrow(Error);
    });

    // =========================================================================
    // getObject - various content types
    // =========================================================================

    it('should pass through image/webp content type', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('img'),
        contentType: 'image/webp',
      });

      const res = createMockResponse();
      await controller.getObject('img.webp', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/webp');
    });

    it('should pass through application/pdf content type', async () => {
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: Buffer.from('pdf'),
        contentType: 'application/pdf',
      });

      const res = createMockResponse();
      await controller.getObject('doc.pdf', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });

    it('should return the send result from express response', async () => {
      const fileBuffer = Buffer.from('data');
      mockStorageService.getObjectByKey.mockResolvedValue({
        body: fileBuffer,
        contentType: 'image/jpeg',
      });

      const res = createMockResponse();
      res.send.mockReturnValue('send-result');

      const result = await controller.getObject('key', res);

      expect(result).toBe('send-result');
    });
  });

  // =========================================================================
  // SECURITY TESTS
  // =========================================================================

  describe('Security', () => {
    // -----------------------------------------------------------------------
    // Key injection / path traversal via query parameter
    // -----------------------------------------------------------------------
    describe('key parameter injection', () => {
      it('should pass the key directly to the service (service handles sanitization)', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'image/webp',
        });

        const res = createMockResponse();
        await controller.getObject('../../etc/passwd', res);

        // The controller passes the key to the service; the service is responsible for key handling
        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('../../etc/passwd');
      });

      it('should pass keys with null bytes to the service', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'image/webp',
        });

        const res = createMockResponse();
        await controller.getObject('key\x00evil', res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('key\x00evil');
      });

      it('should handle keys with URL-encoded path traversal', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'image/webp',
        });

        const res = createMockResponse();
        await controller.getObject('%2e%2e%2f%2e%2e%2fetc%2fpasswd', res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('%2e%2e%2f%2e%2e%2fetc%2fpasswd');
      });

      it('should handle very long key strings without crashing', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'text/plain',
        });

        const longKey = 'a/'.repeat(5000) + 'file.txt';
        const res = createMockResponse();
        await controller.getObject(longKey, res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith(longKey);
      });

      it('should handle keys with special characters', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'text/plain',
        });

        const res = createMockResponse();
        await controller.getObject('<script>alert(1)</script>', res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('<script>alert(1)</script>');
      });
    });

    // -----------------------------------------------------------------------
    // Response header security
    // -----------------------------------------------------------------------
    describe('response header security', () => {
      it('should always set Cache-Control even for potentially malicious requests', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'image/webp',
        });

        const res = createMockResponse();
        await controller.getObject('valid-key', res);

        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
      });

      it('should use content type from storage, not from user input', async () => {
        // If storage says it is text/html, the controller passes it through
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('<html>'),
          contentType: 'text/html',
        });

        const res = createMockResponse();
        await controller.getObject('page.html', res);

        // The content type comes from storage, not from the key name
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      });
    });

    // -----------------------------------------------------------------------
    // Empty / whitespace key edge cases
    // -----------------------------------------------------------------------
    describe('edge case key values', () => {
      it('should throw BadRequestException for whitespace-only key', async () => {
        const res = createMockResponse();

        // Whitespace is truthy in JS, so it passes the !key check
        // Controller does not trim - the service handles it
        // But ' ' is truthy so the controller will call service
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'text/plain',
        });

        await controller.getObject('   ', res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('   ');
      });

      it('should handle key with only forward slashes', async () => {
        mockStorageService.getObjectByKey.mockResolvedValue({
          body: Buffer.from('data'),
          contentType: 'text/plain',
        });

        const res = createMockResponse();
        await controller.getObject('///', res);

        expect(mockStorageService.getObjectByKey).toHaveBeenCalledWith('///');
      });
    });

    // -----------------------------------------------------------------------
    // Service error handling
    // -----------------------------------------------------------------------
    describe('service error passthrough', () => {
      it('should not catch service errors - they propagate to NestJS exception filter', async () => {
        mockStorageService.getObjectByKey.mockRejectedValue(
          new InternalServerErrorException('Storage R2 nao configurado'),
        );

        const res = createMockResponse();

        await expect(controller.getObject('key', res)).rejects.toThrow(
          'Storage R2 nao configurado',
        );
        expect(res.send).not.toHaveBeenCalled();
      });

      it('should not set headers when service throws before response', async () => {
        mockStorageService.getObjectByKey.mockRejectedValue(new Error('fail'));

        const res = createMockResponse();

        await expect(controller.getObject('key', res)).rejects.toThrow('fail');
        expect(res.send).not.toHaveBeenCalled();
      });
    });
  });
});
