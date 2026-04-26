import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from '../checklist.controller';
import { ChecklistService } from '../checklist.service';
import { StorageService } from '../../storage/storage.service';
import { FindAppointmentByIdRepository } from '../../appointment/repository';
import { CreateChecklistDto } from '../dto/create-checklist.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';
import { NotFoundException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockChecklistService = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByAppointment: jest.fn(),
  findByUser: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

const mockFindAppointmentByIdRepository = {
  findById: jest.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_UUID = '11111111-1111-1111-1111-111111111111';
const OTHER_UUID = '22222222-2222-2222-2222-222222222222';
const USER_UUID = '33333333-3333-3333-3333-333333333333';
const ATTACKER_UUID = '44444444-4444-4444-4444-444444444444';
const SHOP_ID = '55555555-5555-5555-5555-555555555555';
const ORG_ID = '66666666-6666-6666-6666-666666666666';

const sampleChecklist = {
  id: VALID_UUID,
  appointmentId: OTHER_UUID,
  description: 'All good',
  photos: ['https://cdn.example.com/photo1.jpg', 'https://cdn.example.com/photo2.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleAppointment = {
  id: OTHER_UUID,
  shopId: SHOP_ID,
  shop: {
    id: SHOP_ID,
    organizationId: ORG_ID,
  },
};

const createDto: CreateChecklistDto = {
  appointmentId: OTHER_UUID,
  description: 'Arrival checklist',
  photos: ['https://cdn.example.com/pic.jpg'],
};

const updateDto: UpdateChecklistDto = {
  description: 'Updated description',
  photos: ['https://cdn.example.com/new.jpg'],
};

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'photos',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('ChecklistController', () => {
  let controller: ChecklistController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [
        { provide: ChecklistService, useValue: mockChecklistService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: FindAppointmentByIdRepository, useValue: mockFindAppointmentByIdRepository },
      ],
    }).compile();

    controller = module.get<ChecklistController>(ChecklistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should create checklist without files', async () => {
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      const result = await controller.create([], createDto);

      expect(mockChecklistService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(sampleChecklist);
    });

    it('should create checklist with no files array (undefined)', async () => {
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      const result = await controller.create(undefined as any, createDto);

      expect(mockChecklistService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(sampleChecklist);
    });

    it('should upload files and set photo URLs on DTO when files are provided', async () => {
      const files = [createMockFile(), createMockFile({ originalname: 'test2.jpg' })];
      const uploadedUrls = ['https://cdn.example.com/upload1.webp', 'https://cdn.example.com/upload2.webp'];

      mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
      mockStorageService.uploadFile
        .mockResolvedValueOnce(uploadedUrls[0])
        .mockResolvedValueOnce(uploadedUrls[1]);
      mockChecklistService.create.mockResolvedValue({ ...sampleChecklist, photos: uploadedUrls });

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID, description: 'With photos' };
      const result = await controller.create(files, dto);

      expect(mockFindAppointmentByIdRepository.findById).toHaveBeenCalledWith(OTHER_UUID);
      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(2);
      expect(dto.photos).toEqual(uploadedUrls);
      expect(result.photos).toEqual(uploadedUrls);
    });

    it('should pass correct upload context for each file', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/uploaded.webp');
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };
      await controller.create(files, dto);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
        file: files[0],
        fileType: 'IMAGE',
        context: {
          type: 'SHOP',
          organizationId: ORG_ID,
          shopId: SHOP_ID,
          category: 'checklist',
          appointmentId: OTHER_UUID,
        },
      });
    });

    it('should throw NotFoundException when appointment is not found for file upload', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue(null);

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };

      await expect(controller.create(files, dto)).rejects.toThrow(NotFoundException);
      await expect(controller.create(files, dto)).rejects.toThrow('Agendamento/loja nao encontrados para upload de checklist');
    });

    it('should throw NotFoundException when appointment has no shop', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue({ id: OTHER_UUID, shop: null });

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };

      await expect(controller.create(files, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when appointment shop has no organizationId', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue({
        id: OTHER_UUID,
        shop: { id: SHOP_ID, organizationId: null },
      });

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };

      await expect(controller.create(files, dto)).rejects.toThrow(NotFoundException);
    });

    it('should propagate errors from checklistService.create', async () => {
      mockChecklistService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create([], createDto)).rejects.toThrow('Creation failed');
    });

    it('should propagate errors from storageService.uploadFile', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
      mockStorageService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };

      await expect(controller.create(files, dto)).rejects.toThrow('Upload failed');
    });

    it('should not call storage service when files array is empty', async () => {
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      await controller.create([], createDto);

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
      expect(mockFindAppointmentByIdRepository.findById).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to checklistService.findOne with the id', async () => {
      mockChecklistService.findOne.mockResolvedValue(sampleChecklist);

      const result = await controller.findOne(VALID_UUID);

      expect(mockChecklistService.findOne).toHaveBeenCalledTimes(1);
      expect(mockChecklistService.findOne).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate errors from the service', async () => {
      mockChecklistService.findOne.mockRejectedValue(new NotFoundException('Checklist not found'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // findByAppointment
  // -----------------------------------------------------------
  describe('findByAppointment', () => {
    it('should delegate to checklistService.findByAppointment with appointmentId', async () => {
      mockChecklistService.findByAppointment.mockResolvedValue(sampleChecklist);

      const result = await controller.findByAppointment(OTHER_UUID);

      expect(mockChecklistService.findByAppointment).toHaveBeenCalledTimes(1);
      expect(mockChecklistService.findByAppointment).toHaveBeenCalledWith(OTHER_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate errors from the service', async () => {
      mockChecklistService.findByAppointment.mockRejectedValue(
        new NotFoundException('Checklist not found for this appointment'),
      );

      await expect(controller.findByAppointment('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // findByUser
  // -----------------------------------------------------------
  describe('findByUser', () => {
    const paginatedResult = {
      data: [sampleChecklist],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to checklistService.findByUser with parsed page and perPage', async () => {
      mockChecklistService.findByUser.mockResolvedValue(paginatedResult);

      const result = await controller.findByUser(USER_UUID, '2', '20');

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, 2, 20);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass undefined for page and perPage when not provided', async () => {
      mockChecklistService.findByUser.mockResolvedValue(paginatedResult);

      await controller.findByUser(USER_UUID);

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, undefined, undefined);
    });

    it('should pass undefined for perPage when only page is provided', async () => {
      mockChecklistService.findByUser.mockResolvedValue(paginatedResult);

      await controller.findByUser(USER_UUID, '1');

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, 1, undefined);
    });

    it('should convert string page/perPage to numbers', async () => {
      mockChecklistService.findByUser.mockResolvedValue(paginatedResult);

      await controller.findByUser(USER_UUID, '5', '50');

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, 5, 50);
    });

    it('should pass NaN when page is non-numeric string', async () => {
      mockChecklistService.findByUser.mockResolvedValue(paginatedResult);

      await controller.findByUser(USER_UUID, 'abc', 'xyz');

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, NaN, NaN);
    });

    it('should propagate errors from the service', async () => {
      mockChecklistService.findByUser.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findByUser(USER_UUID, '1', '10')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to checklistService.update with id and DTO', async () => {
      const updatedChecklist = { ...sampleChecklist, ...updateDto };
      mockChecklistService.update.mockResolvedValue(updatedChecklist);

      const result = await controller.update(VALID_UUID, updateDto);

      expect(mockChecklistService.update).toHaveBeenCalledTimes(1);
      expect(mockChecklistService.update).toHaveBeenCalledWith(VALID_UUID, updateDto);
      expect(result).toEqual(updatedChecklist);
    });

    it('should propagate errors from the service', async () => {
      mockChecklistService.update.mockRejectedValue(new NotFoundException('Checklist not found'));

      await expect(controller.update('bad-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should allow partial update with empty DTO', async () => {
      mockChecklistService.update.mockResolvedValue(sampleChecklist);

      await controller.update(VALID_UUID, {});

      expect(mockChecklistService.update).toHaveBeenCalledWith(VALID_UUID, {});
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delete photos from storage before removing checklist', async () => {
      mockChecklistService.findOne.mockResolvedValue(sampleChecklist);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockChecklistService.remove.mockResolvedValue(sampleChecklist);

      await controller.remove(VALID_UUID);

      expect(mockChecklistService.findOne).toHaveBeenCalledWith(VALID_UUID);
      expect(mockStorageService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/photo1.jpg');
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('https://cdn.example.com/photo2.jpg');
      expect(mockChecklistService.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should still remove checklist even if photo deletion fails', async () => {
      mockChecklistService.findOne.mockResolvedValue(sampleChecklist);
      mockStorageService.deleteFile.mockRejectedValue(new Error('Storage error'));
      mockChecklistService.remove.mockResolvedValue(sampleChecklist);

      // Uses Promise.allSettled so individual failures do not block
      const result = await controller.remove(VALID_UUID);

      expect(mockChecklistService.remove).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should skip photo deletion when checklist has no photos', async () => {
      const checklistNoPhotos = { ...sampleChecklist, photos: [] };
      mockChecklistService.findOne.mockResolvedValue(checklistNoPhotos);
      mockChecklistService.remove.mockResolvedValue(checklistNoPhotos);

      await controller.remove(VALID_UUID);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(mockChecklistService.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should skip photo deletion when checklist has null photos', async () => {
      const checklistNullPhotos = { ...sampleChecklist, photos: null };
      mockChecklistService.findOne.mockResolvedValue(checklistNullPhotos);
      mockChecklistService.remove.mockResolvedValue(checklistNullPhotos);

      await controller.remove(VALID_UUID);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(mockChecklistService.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should skip photo deletion when checklist is null', async () => {
      mockChecklistService.findOne.mockResolvedValue(null);
      mockChecklistService.remove.mockResolvedValue(null);

      await controller.remove(VALID_UUID);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
      expect(mockChecklistService.remove).toHaveBeenCalledWith(VALID_UUID);
    });

    it('should propagate errors from findOne in remove flow', async () => {
      mockChecklistService.findOne.mockRejectedValue(new NotFoundException('Checklist not found'));

      await expect(controller.remove('bad-id')).rejects.toThrow(NotFoundException);
      expect(mockChecklistService.remove).not.toHaveBeenCalled();
    });

    it('should propagate errors from checklistService.remove', async () => {
      mockChecklistService.findOne.mockResolvedValue({ ...sampleChecklist, photos: [] });
      mockChecklistService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(VALID_UUID)).rejects.toThrow('Delete failed');
    });
  });

  // -----------------------------------------------------------
  // Security
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('IDOR - accessing other users data', () => {
      it('should allow any userId in findByUser - no ownership check at controller level', async () => {
        mockChecklistService.findByUser.mockResolvedValue({ data: [], meta: {} });

        await controller.findByUser(ATTACKER_UUID, '1', '10');

        expect(mockChecklistService.findByUser).toHaveBeenCalledWith(ATTACKER_UUID, 1, 10);
      });

      it('should allow any checklist id in findOne', async () => {
        mockChecklistService.findOne.mockResolvedValue(sampleChecklist);

        await controller.findOne(ATTACKER_UUID);

        expect(mockChecklistService.findOne).toHaveBeenCalledWith(ATTACKER_UUID);
      });

      it('should allow any appointmentId in findByAppointment', async () => {
        mockChecklistService.findByAppointment.mockResolvedValue(sampleChecklist);

        await controller.findByAppointment(ATTACKER_UUID);

        expect(mockChecklistService.findByAppointment).toHaveBeenCalledWith(ATTACKER_UUID);
      });

      it('should allow any id in update without ownership verification', async () => {
        mockChecklistService.update.mockResolvedValue(sampleChecklist);

        await controller.update(ATTACKER_UUID, updateDto);

        expect(mockChecklistService.update).toHaveBeenCalledWith(ATTACKER_UUID, updateDto);
      });

      it('should allow any id in remove without ownership verification', async () => {
        mockChecklistService.findOne.mockResolvedValue({ ...sampleChecklist, photos: [] });
        mockChecklistService.remove.mockResolvedValue(sampleChecklist);

        await controller.remove(ATTACKER_UUID);

        expect(mockChecklistService.remove).toHaveBeenCalledWith(ATTACKER_UUID);
      });
    });

    describe('Input validation edge cases', () => {
      it('should forward SQL-injection-like id to service', async () => {
        const maliciousId = "'; DROP TABLE checklists; --";
        mockChecklistService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne(maliciousId)).rejects.toThrow(NotFoundException);
        expect(mockChecklistService.findOne).toHaveBeenCalledWith(maliciousId);
      });

      it('should forward empty string id to service', async () => {
        mockChecklistService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne('')).rejects.toThrow(NotFoundException);
        expect(mockChecklistService.findOne).toHaveBeenCalledWith('');
      });

      it('should forward path traversal-like id to service', async () => {
        const maliciousId = '../../../etc/passwd';
        mockChecklistService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne(maliciousId)).rejects.toThrow(NotFoundException);
        expect(mockChecklistService.findOne).toHaveBeenCalledWith(maliciousId);
      });
    });

    describe('Data tampering in file uploads', () => {
      it('should use the appointmentId from DTO for upload context, not from a separate parameter', async () => {
        const files = [createMockFile()];
        mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
        mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/uploaded.webp');
        mockChecklistService.create.mockResolvedValue(sampleChecklist);

        const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };
        await controller.create(files, dto);

        const uploadCall = mockStorageService.uploadFile.mock.calls[0][0];
        expect(uploadCall.context.appointmentId).toBe(OTHER_UUID);
      });

      it('should mutate the DTO photos field in place when uploading files', async () => {
        const files = [createMockFile()];
        mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
        mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/uploaded.webp');
        mockChecklistService.create.mockResolvedValue(sampleChecklist);

        const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };
        await controller.create(files, dto);

        // The controller mutates dto.photos before passing to service
        expect(dto.photos).toEqual(['https://cdn.example.com/uploaded.webp']);
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle findByUser with page=0 string', async () => {
      mockChecklistService.findByUser.mockResolvedValue({ data: [], meta: {} });

      await controller.findByUser(USER_UUID, '0', '0');

      expect(mockChecklistService.findByUser).toHaveBeenCalledWith(USER_UUID, 0, 0);
    });

    it('should handle single file upload correctly', async () => {
      const files = [createMockFile()];
      mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/single.webp');
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };
      await controller.create(files, dto);

      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(1);
      expect(dto.photos).toEqual(['https://cdn.example.com/single.webp']);
    });

    it('should handle maximum 10 files (as configured in interceptor)', async () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createMockFile({ originalname: `file${i}.jpg` }),
      );
      mockFindAppointmentByIdRepository.findById.mockResolvedValue(sampleAppointment);
      mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/file.webp');
      mockChecklistService.create.mockResolvedValue(sampleChecklist);

      const dto: CreateChecklistDto = { appointmentId: OTHER_UUID };
      await controller.create(files, dto);

      expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(10);
      expect(dto.photos).toHaveLength(10);
    });

    it('should call findOne before remove to check for photos', async () => {
      mockChecklistService.findOne.mockResolvedValue(sampleChecklist);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockChecklistService.remove.mockResolvedValue(sampleChecklist);

      await controller.remove(VALID_UUID);

      // Verify ordering: findOne called first
      const findOneOrder = mockChecklistService.findOne.mock.invocationCallOrder[0];
      const removeOrder = mockChecklistService.remove.mock.invocationCallOrder[0];
      expect(findOneOrder).toBeLessThan(removeOrder);
    });
  });
});
