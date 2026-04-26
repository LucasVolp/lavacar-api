import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistService } from '../checklist.service';
import {
  CreateChecklistUseCase,
  DeleteChecklistUseCase,
  FindChecklistByIdUseCase,
  FindChecklistsByUserUseCase,
  UpdateChecklistUseCase,
} from '../use-cases';
import { CreateChecklistDto } from '../dto/create-checklist.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockCreateChecklistUseCase = { execute: jest.fn() };
const mockFindChecklistByIdUseCase = {
  execute: jest.fn(),
  executeByAppointmentId: jest.fn(),
};
const mockFindChecklistsByUserUseCase = { execute: jest.fn() };
const mockUpdateChecklistUseCase = { execute: jest.fn() };
const mockDeleteChecklistUseCase = { execute: jest.fn() };

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_UUID = '11111111-1111-1111-1111-111111111111';
const OTHER_UUID = '22222222-2222-2222-2222-222222222222';
const USER_UUID = '33333333-3333-3333-3333-333333333333';
const ATTACKER_UUID = '44444444-4444-4444-4444-444444444444';

const sampleChecklist = {
  id: VALID_UUID,
  appointmentId: OTHER_UUID,
  description: 'All good',
  photos: ['https://cdn.example.com/photo1.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('ChecklistService', () => {
  let service: ChecklistService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: CreateChecklistUseCase, useValue: mockCreateChecklistUseCase },
        { provide: FindChecklistByIdUseCase, useValue: mockFindChecklistByIdUseCase },
        { provide: FindChecklistsByUserUseCase, useValue: mockFindChecklistsByUserUseCase },
        { provide: UpdateChecklistUseCase, useValue: mockUpdateChecklistUseCase },
        { provide: DeleteChecklistUseCase, useValue: mockDeleteChecklistUseCase },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to CreateChecklistUseCase with the DTO', async () => {
      mockCreateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      const result = await service.create(createDto);

      expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate errors from CreateChecklistUseCase', async () => {
      mockCreateChecklistUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.create(createDto)).rejects.toThrow('DB error');
    });

    it('should forward DTO without photos when photos are omitted', async () => {
      const dtoWithoutPhotos: CreateChecklistDto = {
        appointmentId: OTHER_UUID,
        description: 'No photos',
      };
      mockCreateChecklistUseCase.execute.mockResolvedValue({ ...sampleChecklist, photos: [] });

      await service.create(dtoWithoutPhotos);

      expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(dtoWithoutPhotos);
    });

    it('should forward DTO without description when description is omitted', async () => {
      const dtoWithoutDesc: CreateChecklistDto = {
        appointmentId: OTHER_UUID,
      };
      mockCreateChecklistUseCase.execute.mockResolvedValue({ ...sampleChecklist, description: null });

      await service.create(dtoWithoutDesc);

      expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(dtoWithoutDesc);
    });

    it('should return the exact value resolved by the use case', async () => {
      const customResult = { id: 'custom-id', appointmentId: OTHER_UUID };
      mockCreateChecklistUseCase.execute.mockResolvedValue(customResult);

      const result = await service.create(createDto);

      expect(result).toBe(customResult);
    });

    it('should not modify the DTO before passing it to the use case', async () => {
      const frozenDto = Object.freeze({ ...createDto });
      mockCreateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      await service.create(frozenDto as CreateChecklistDto);

      expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(frozenDto);
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindChecklistByIdUseCase.execute', async () => {
      mockFindChecklistByIdUseCase.execute.mockResolvedValue(sampleChecklist);

      const result = await service.findOne(VALID_UUID);

      expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate NotFoundException when checklist does not exist', async () => {
      mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

      await expect(service.findOne('nonexistent-id')).rejects.toThrow('Checklist not found');
    });

    it('should propagate ServiceUnavailableException on unexpected errors', async () => {
      mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Something bad happened!'));

      await expect(service.findOne(VALID_UUID)).rejects.toThrow('Something bad happened!');
    });

    it('should not call executeByAppointmentId', async () => {
      mockFindChecklistByIdUseCase.execute.mockResolvedValue(sampleChecklist);

      await service.findOne(VALID_UUID);

      expect(mockFindChecklistByIdUseCase.executeByAppointmentId).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------
  // findByAppointment
  // -----------------------------------------------------------
  describe('findByAppointment', () => {
    it('should delegate to FindChecklistByIdUseCase.executeByAppointmentId', async () => {
      mockFindChecklistByIdUseCase.executeByAppointmentId.mockResolvedValue(sampleChecklist);

      const result = await service.findByAppointment(OTHER_UUID);

      expect(mockFindChecklistByIdUseCase.executeByAppointmentId).toHaveBeenCalledTimes(1);
      expect(mockFindChecklistByIdUseCase.executeByAppointmentId).toHaveBeenCalledWith(OTHER_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate NotFoundException when no checklist for appointment', async () => {
      mockFindChecklistByIdUseCase.executeByAppointmentId.mockRejectedValue(
        new Error('Checklist not found for this appointment'),
      );

      await expect(service.findByAppointment('no-appt')).rejects.toThrow(
        'Checklist not found for this appointment',
      );
    });

    it('should not call execute (by id)', async () => {
      mockFindChecklistByIdUseCase.executeByAppointmentId.mockResolvedValue(sampleChecklist);

      await service.findByAppointment(OTHER_UUID);

      expect(mockFindChecklistByIdUseCase.execute).not.toHaveBeenCalled();
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

    it('should delegate to FindChecklistsByUserUseCase with all parameters', async () => {
      mockFindChecklistsByUserUseCase.execute.mockResolvedValue(paginatedResult);

      const result = await service.findByUser(USER_UUID, 2, 5);

      expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, 2, 5);
      expect(result).toEqual(paginatedResult);
    });

    it('should delegate with undefined page and perPage when not provided', async () => {
      mockFindChecklistsByUserUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findByUser(USER_UUID);

      expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(
        USER_UUID,
        undefined,
        undefined,
      );
    });

    it('should pass page=1 and undefined perPage when only page is provided', async () => {
      mockFindChecklistsByUserUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findByUser(USER_UUID, 1);

      expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, 1, undefined);
    });

    it('should propagate errors when user is not found', async () => {
      mockFindChecklistsByUserUseCase.execute.mockRejectedValue(
        new Error('User with ID nonexistent not found'),
      );

      await expect(service.findByUser('nonexistent')).rejects.toThrow('User with ID nonexistent not found');
    });

    it('should return paginated result with multiple checklists', async () => {
      const multiResult = {
        data: [sampleChecklist, { ...sampleChecklist, id: OTHER_UUID }],
        meta: { total: 2, page: 1, perPage: 10, totalPages: 1 },
      };
      mockFindChecklistsByUserUseCase.execute.mockResolvedValue(multiResult);

      const result = await service.findByUser(USER_UUID, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to UpdateChecklistUseCase with id and DTO', async () => {
      const updatedChecklist = { ...sampleChecklist, ...updateDto };
      mockUpdateChecklistUseCase.execute.mockResolvedValue(updatedChecklist);

      const result = await service.update(VALID_UUID, updateDto);

      expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, updateDto);
      expect(result).toEqual(updatedChecklist);
    });

    it('should propagate NotFoundException when checklist does not exist', async () => {
      mockUpdateChecklistUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow('Checklist not found');
    });

    it('should propagate errors from UpdateChecklistUseCase', async () => {
      mockUpdateChecklistUseCase.execute.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(VALID_UUID, updateDto)).rejects.toThrow('Update failed');
    });

    it('should allow partial update with only description', async () => {
      const partialDto: UpdateChecklistDto = { description: 'Only desc' };
      mockUpdateChecklistUseCase.execute.mockResolvedValue({ ...sampleChecklist, description: 'Only desc' });

      await service.update(VALID_UUID, partialDto);

      expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, partialDto);
    });

    it('should allow partial update with only photos', async () => {
      const partialDto: UpdateChecklistDto = { photos: ['https://cdn.example.com/x.jpg'] };
      mockUpdateChecklistUseCase.execute.mockResolvedValue({ ...sampleChecklist, photos: partialDto.photos });

      await service.update(VALID_UUID, partialDto);

      expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, partialDto);
    });

    it('should pass both id and data as separate arguments', async () => {
      mockUpdateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      await service.update(VALID_UUID, updateDto);

      const callArgs = mockUpdateChecklistUseCase.execute.mock.calls[0];
      expect(callArgs[0]).toBe(VALID_UUID);
      expect(callArgs[1]).toBe(updateDto);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteChecklistUseCase', async () => {
      mockDeleteChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      const result = await service.remove(VALID_UUID);

      expect(mockDeleteChecklistUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID);
      expect(result).toEqual(sampleChecklist);
    });

    it('should propagate NotFoundException when checklist does not exist', async () => {
      mockDeleteChecklistUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

      await expect(service.remove('nonexistent')).rejects.toThrow('Checklist not found');
    });

    it('should propagate errors from DeleteChecklistUseCase', async () => {
      mockDeleteChecklistUseCase.execute.mockRejectedValue(new Error('Delete failed'));

      await expect(service.remove(VALID_UUID)).rejects.toThrow('Delete failed');
    });

    it('should return the deleted checklist data', async () => {
      mockDeleteChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      const result = await service.remove(VALID_UUID);

      expect(result).toHaveProperty('id', VALID_UUID);
      expect(result).toHaveProperty('appointmentId', OTHER_UUID);
    });
  });

  // -----------------------------------------------------------
  // Security: IDOR / Input validation
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('IDOR - accessing other users data', () => {
      it('should pass the exact userId provided to findByUser without modification', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser('attacker-user-id');

        // The service simply delegates; authorization must be enforced upstream.
        // This test documents that the service does NOT filter by authenticated user.
        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(
          'attacker-user-id',
          undefined,
          undefined,
        );
      });

      it('should pass the exact id provided to findOne without modification', async () => {
        mockFindChecklistByIdUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.findOne('any-checklist-id');

        expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith('any-checklist-id');
      });

      it('should allow any userId to be passed to findByUser - no ownership check at service layer', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [sampleChecklist], meta: {} });

        // Attacker trying to fetch another user's checklists
        const result = await service.findByUser(ATTACKER_UUID, 1, 10);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(ATTACKER_UUID, 1, 10);
        expect(result.data).toHaveLength(1);
      });

      it('should allow any appointmentId to be passed to findByAppointment', async () => {
        mockFindChecklistByIdUseCase.executeByAppointmentId.mockResolvedValue(sampleChecklist);

        await service.findByAppointment(ATTACKER_UUID);

        expect(mockFindChecklistByIdUseCase.executeByAppointmentId).toHaveBeenCalledWith(ATTACKER_UUID);
      });

      it('should allow any id to be passed to update - no ownership check at service layer', async () => {
        mockUpdateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.update(ATTACKER_UUID, updateDto);

        expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(ATTACKER_UUID, updateDto);
      });

      it('should allow any id to be passed to remove - no ownership check at service layer', async () => {
        mockDeleteChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.remove(ATTACKER_UUID);

        expect(mockDeleteChecklistUseCase.execute).toHaveBeenCalledWith(ATTACKER_UUID);
      });
    });

    describe('Input validation edge cases', () => {
      it('should forward empty string id to use case (validation at DTO/pipe layer)', async () => {
        mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

        await expect(service.findOne('')).rejects.toThrow('Checklist not found');
        expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith('');
      });

      it('should forward SQL-injection-like string to use case (Prisma handles sanitization)', async () => {
        const maliciousId = "'; DROP TABLE checklists; --";
        mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

        await expect(service.findOne(maliciousId)).rejects.toThrow('Checklist not found');
        expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith(maliciousId);
      });

      it('should forward NoSQL injection-like objects by passing them as-is', async () => {
        const maliciousId = '{"$gt": ""}';
        mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

        await expect(service.findOne(maliciousId)).rejects.toThrow('Checklist not found');
        expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith(maliciousId);
      });

      it('should forward negative page numbers to use case', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser(USER_UUID, -1, -5);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, -1, -5);
      });

      it('should forward zero page and perPage to use case', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser(USER_UUID, 0, 0);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, 0, 0);
      });

      it('should forward extremely large page numbers to use case', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser(USER_UUID, 999999, 999999);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, 999999, 999999);
      });

      it('should forward NaN-coerced values to use case', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser(USER_UUID, NaN, NaN);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, NaN, NaN);
      });

      it('should forward Infinity values to use case', async () => {
        mockFindChecklistsByUserUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findByUser(USER_UUID, Infinity, Infinity);

        expect(mockFindChecklistsByUserUseCase.execute).toHaveBeenCalledWith(USER_UUID, Infinity, Infinity);
      });

      it('should forward path traversal-like id to use case', async () => {
        const maliciousId = '../../../etc/passwd';
        mockFindChecklistByIdUseCase.execute.mockRejectedValue(new Error('Checklist not found'));

        await expect(service.findOne(maliciousId)).rejects.toThrow('Checklist not found');
        expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledWith(maliciousId);
      });

      it('should forward XSS-like string as description in create DTO', async () => {
        const xssDto: CreateChecklistDto = {
          appointmentId: OTHER_UUID,
          description: '<script>alert("xss")</script>',
        };
        mockCreateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.create(xssDto);

        expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(xssDto);
      });
    });

    describe('Data tampering', () => {
      it('should forward DTO with injected extra fields to use case', async () => {
        const tamperedDto = {
          ...createDto,
          id: 'tampered-id',
          createdAt: new Date('2000-01-01'),
        } as any;
        mockCreateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.create(tamperedDto);

        expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledWith(tamperedDto);
      });

      it('should forward update DTO with appointmentId to use case (DTO validation should strip it)', async () => {
        const tamperedUpdate = {
          ...updateDto,
          appointmentId: 'different-appointment-id',
        } as any;
        mockUpdateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.update(VALID_UUID, tamperedUpdate);

        expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, tamperedUpdate);
      });

      it('should forward DTO with __proto__ pollution attempt to use case', async () => {
        const pollutedDto = {
          appointmentId: OTHER_UUID,
          description: 'test',
          ['__proto__']: { isAdmin: true },
        } as any;
        mockCreateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.create(pollutedDto);

        expect(mockCreateChecklistUseCase.execute).toHaveBeenCalledTimes(1);
      });

      it('should forward update DTO with role escalation fields', async () => {
        const tamperedUpdate = {
          ...updateDto,
          userId: ATTACKER_UUID,
          role: 'ADMIN',
        } as any;
        mockUpdateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

        await service.update(VALID_UUID, tamperedUpdate);

        expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, tamperedUpdate);
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle create returning null', async () => {
      mockCreateChecklistUseCase.execute.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result).toBeNull();
    });

    it('should handle create returning undefined', async () => {
      mockCreateChecklistUseCase.execute.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toBeUndefined();
    });

    it('should handle findByUser returning empty data array', async () => {
      const emptyResult = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
      mockFindChecklistsByUserUseCase.execute.mockResolvedValue(emptyResult);

      const result = await service.findByUser(USER_UUID);

      expect(result).toEqual(emptyResult);
    });

    it('should handle update with empty DTO', async () => {
      const emptyDto: UpdateChecklistDto = {};
      mockUpdateChecklistUseCase.execute.mockResolvedValue(sampleChecklist);

      await service.update(VALID_UUID, emptyDto);

      expect(mockUpdateChecklistUseCase.execute).toHaveBeenCalledWith(VALID_UUID, emptyDto);
    });

    it('should handle findOne returning checklist with empty photos array', async () => {
      const checklistNoPhotos = { ...sampleChecklist, photos: [] };
      mockFindChecklistByIdUseCase.execute.mockResolvedValue(checklistNoPhotos);

      const result = await service.findOne(VALID_UUID);

      expect(result.photos).toEqual([]);
    });

    it('should handle findOne returning checklist with null description', async () => {
      const checklistNullDesc = { ...sampleChecklist, description: null };
      mockFindChecklistByIdUseCase.execute.mockResolvedValue(checklistNullDesc);

      const result = await service.findOne(VALID_UUID);

      expect(result.description).toBeNull();
    });

    it('should handle concurrent calls without interference', async () => {
      mockFindChecklistByIdUseCase.execute
        .mockResolvedValueOnce({ ...sampleChecklist, id: 'first' })
        .mockResolvedValueOnce({ ...sampleChecklist, id: 'second' });

      const [first, second] = await Promise.all([
        service.findOne('id-1'),
        service.findOne('id-2'),
      ]);

      expect(first.id).toBe('first');
      expect(second.id).toBe('second');
      expect(mockFindChecklistByIdUseCase.execute).toHaveBeenCalledTimes(2);
    });
  });
});
