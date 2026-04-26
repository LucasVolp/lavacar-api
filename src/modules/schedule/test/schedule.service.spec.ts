import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from '../schedule.service';
import {
  CreateScheduleUseCase,
  DeleteScheduleUseCase,
  FindAllScheduleUseCase,
  FindPublicSchedulesUseCase,
  FindScheduleByIdUseCase,
  UpdateScheduleUseCase,
} from '../use-cases';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Weekday } from '../types/Weekday';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockCreateScheduleUseCase = { execute: jest.fn() };
const mockFindAllScheduleUseCase = { execute: jest.fn() };
const mockFindPublicSchedulesUseCase = { execute: jest.fn() };
const mockFindScheduleByIdUseCase = { execute: jest.fn() };
const mockUpdateScheduleUseCase = { execute: jest.fn() };
const mockDeleteScheduleUseCase = { execute: jest.fn() };

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_UUID = '11111111-1111-1111-1111-111111111111';
const SHOP_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_SHOP_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = '44444444-4444-4444-4444-444444444444';
const ATTACKER_USER_ID = '55555555-5555-5555-5555-555555555555';

const adminUser: JwtPayload = {
  id: USER_ID,
  email: 'admin@example.com',
  phone: '11999999999',
  role: 'ADMIN',
};

const ownerUser: JwtPayload = {
  id: USER_ID,
  email: 'owner@example.com',
  phone: '11888888888',
  role: 'OWNER',
};

const employeeUser: JwtPayload = {
  id: USER_ID,
  email: 'employee@example.com',
  phone: '11777777777',
  role: 'EMPLOYEE',
};

const regularUser: JwtPayload = {
  id: USER_ID,
  email: 'user@example.com',
  phone: '11666666666',
  role: 'USER',
};

const attackerUser: JwtPayload = {
  id: ATTACKER_USER_ID,
  email: 'attacker@example.com',
  phone: '11555555555',
  role: 'EMPLOYEE',
};

const sampleSchedule = {
  id: VALID_UUID,
  weekday: Weekday.MONDAY,
  startTime: '08:00',
  endTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  isOpen: 'ACTIVE',
  shopId: SHOP_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createDto: CreateScheduleDto = {
  weekday: Weekday.MONDAY,
  startTime: '08:00',
  endTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  shopId: SHOP_ID,
};

const updateDto: UpdateScheduleDto = {
  startTime: '09:00',
  endTime: '17:00',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: CreateScheduleUseCase, useValue: mockCreateScheduleUseCase },
        { provide: FindAllScheduleUseCase, useValue: mockFindAllScheduleUseCase },
        { provide: FindPublicSchedulesUseCase, useValue: mockFindPublicSchedulesUseCase },
        { provide: FindScheduleByIdUseCase, useValue: mockFindScheduleByIdUseCase },
        { provide: UpdateScheduleUseCase, useValue: mockUpdateScheduleUseCase },
        { provide: DeleteScheduleUseCase, useValue: mockDeleteScheduleUseCase },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to CreateScheduleUseCase with DTO and user', async () => {
      mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      const result = await service.create(createDto, adminUser);

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should propagate errors from CreateScheduleUseCase', async () => {
      mockCreateScheduleUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.create(createDto, adminUser)).rejects.toThrow('DB error');
    });

    it('should pass the user payload as-is to the use case', async () => {
      mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.create(createDto, ownerUser);

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, ownerUser);
    });

    it('should forward DTO without optional break times', async () => {
      const dtoWithoutBreaks: CreateScheduleDto = {
        weekday: Weekday.TUESDAY,
        startTime: '09:00',
        endTime: '17:00',
        shopId: SHOP_ID,
      };
      mockCreateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, ...dtoWithoutBreaks });

      await service.create(dtoWithoutBreaks, adminUser);

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(dtoWithoutBreaks, adminUser);
    });

    it('should forward DTO with isOpen field', async () => {
      const dtoWithStatus: CreateScheduleDto = {
        ...createDto,
        isOpen: 'ACTIVE' as any,
      };
      mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.create(dtoWithStatus, adminUser);

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(dtoWithStatus, adminUser);
    });

    it('should return the exact value from the use case', async () => {
      const customResult = { id: 'custom', weekday: Weekday.FRIDAY };
      mockCreateScheduleUseCase.execute.mockResolvedValue(customResult);

      const result = await service.create(createDto, adminUser);

      expect(result).toBe(customResult);
    });

    it('should create schedule for each weekday', async () => {
      for (const weekday of Object.values(Weekday)) {
        mockCreateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, weekday });

        const dto: CreateScheduleDto = { ...createDto, weekday };
        const result = await service.create(dto, adminUser);

        expect(result.weekday).toBe(weekday);
      }

      expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledTimes(7);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    const paginatedResult = {
      data: [sampleSchedule],
      meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    };

    it('should delegate to FindAllScheduleUseCase with filters and user', async () => {
      mockFindAllScheduleUseCase.execute.mockResolvedValue(paginatedResult);

      const filters = { shopId: SHOP_ID, page: 1, perPage: 10 };
      const result = await service.findAll(filters, adminUser);

      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass empty filters when none provided', async () => {
      mockFindAllScheduleUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll({}, adminUser);

      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should use default empty object when filters parameter is omitted', async () => {
      mockFindAllScheduleUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll(undefined as any, adminUser);

      // When filters is undefined, the method's default parameter (= {}) converts it to an empty object
      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith({}, adminUser);
    });

    it('should propagate errors from FindAllScheduleUseCase', async () => {
      mockFindAllScheduleUseCase.execute.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.findAll({}, adminUser)).rejects.toThrow('Service unavailable');
    });

    it('should pass only shopId filter', async () => {
      mockFindAllScheduleUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll({ shopId: SHOP_ID }, adminUser);

      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith({ shopId: SHOP_ID }, adminUser);
    });

    it('should pass only pagination filters', async () => {
      mockFindAllScheduleUseCase.execute.mockResolvedValue(paginatedResult);

      await service.findAll({ page: 2, perPage: 5 }, adminUser);

      expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith({ page: 2, perPage: 5 }, adminUser);
    });
  });

  // -----------------------------------------------------------
  // findPublicByShopId
  // -----------------------------------------------------------
  describe('findPublicByShopId', () => {
    const publicSchedules = [sampleSchedule];

    it('should delegate to FindPublicSchedulesUseCase with shopId', async () => {
      mockFindPublicSchedulesUseCase.execute.mockResolvedValue(publicSchedules);

      const result = await service.findPublicByShopId(SHOP_ID);

      expect(mockFindPublicSchedulesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindPublicSchedulesUseCase.execute).toHaveBeenCalledWith(SHOP_ID);
      expect(result).toEqual(publicSchedules);
    });

    it('should NOT require a user parameter (public endpoint)', async () => {
      mockFindPublicSchedulesUseCase.execute.mockResolvedValue(publicSchedules);

      // This method does not accept user - verifying the signature
      const result = await service.findPublicByShopId(SHOP_ID);

      expect(mockFindPublicSchedulesUseCase.execute).toHaveBeenCalledWith(SHOP_ID);
      expect(result).toBeDefined();
    });

    it('should propagate errors from FindPublicSchedulesUseCase', async () => {
      mockFindPublicSchedulesUseCase.execute.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.findPublicByShopId(SHOP_ID)).rejects.toThrow('Service unavailable');
    });

    it('should return empty array when no schedules found', async () => {
      mockFindPublicSchedulesUseCase.execute.mockResolvedValue([]);

      const result = await service.findPublicByShopId(SHOP_ID);

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindScheduleByIdUseCase with id and user', async () => {
      mockFindScheduleByIdUseCase.execute.mockResolvedValue(sampleSchedule);

      const result = await service.findOne(VALID_UUID, adminUser);

      expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledWith(VALID_UUID, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should propagate NotFoundException when schedule is not found', async () => {
      mockFindScheduleByIdUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

      await expect(service.findOne('nonexistent', adminUser)).rejects.toThrow('Schedule not found!');
    });

    it('should forward user payload for authorization checks in the use case', async () => {
      mockFindScheduleByIdUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.findOne(VALID_UUID, employeeUser);

      expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledWith(VALID_UUID, employeeUser);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to UpdateScheduleUseCase with id, DTO, and user', async () => {
      const updatedSchedule = { ...sampleSchedule, ...updateDto };
      mockUpdateScheduleUseCase.execute.mockResolvedValue(updatedSchedule);

      const result = await service.update(VALID_UUID, updateDto, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, updateDto, adminUser);
      expect(result).toEqual(updatedSchedule);
    });

    it('should propagate NotFoundException when schedule is not found', async () => {
      mockUpdateScheduleUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

      await expect(service.update('nonexistent', updateDto, adminUser)).rejects.toThrow('Schedule not found!');
    });

    it('should propagate BadRequestException for invalid time ranges', async () => {
      mockUpdateScheduleUseCase.execute.mockRejectedValue(new Error('startTime must be before endTime'));

      await expect(service.update(VALID_UUID, updateDto, adminUser)).rejects.toThrow(
        'startTime must be before endTime',
      );
    });

    it('should allow partial update with only startTime', async () => {
      const partialDto: UpdateScheduleDto = { startTime: '10:00' };
      mockUpdateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, startTime: '10:00' });

      await service.update(VALID_UUID, partialDto, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, partialDto, adminUser);
    });

    it('should allow partial update with only endTime', async () => {
      const partialDto: UpdateScheduleDto = { endTime: '20:00' };
      mockUpdateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, endTime: '20:00' });

      await service.update(VALID_UUID, partialDto, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, partialDto, adminUser);
    });

    it('should allow update with break times', async () => {
      const dtoWithBreaks: UpdateScheduleDto = {
        breakStartTime: '12:30',
        breakEndTime: '13:30',
      };
      mockUpdateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, ...dtoWithBreaks });

      await service.update(VALID_UUID, dtoWithBreaks, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, dtoWithBreaks, adminUser);
    });

    it('should allow update with isOpen status', async () => {
      const dtoWithStatus: UpdateScheduleDto = { isOpen: 'INACTIVE' as any };
      mockUpdateScheduleUseCase.execute.mockResolvedValue({ ...sampleSchedule, isOpen: 'INACTIVE' });

      await service.update(VALID_UUID, dtoWithStatus, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, dtoWithStatus, adminUser);
    });

    it('should pass all three arguments to the use case', async () => {
      mockUpdateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.update(VALID_UUID, updateDto, ownerUser);

      const callArgs = mockUpdateScheduleUseCase.execute.mock.calls[0];
      expect(callArgs).toHaveLength(3);
      expect(callArgs[0]).toBe(VALID_UUID);
      expect(callArgs[1]).toBe(updateDto);
      expect(callArgs[2]).toBe(ownerUser);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteScheduleUseCase with id and user', async () => {
      mockDeleteScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      const result = await service.remove(VALID_UUID, adminUser);

      expect(mockDeleteScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should propagate NotFoundException when schedule is not found', async () => {
      mockDeleteScheduleUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

      await expect(service.remove('nonexistent', adminUser)).rejects.toThrow('Schedule not found!');
    });

    it('should forward user payload for authorization checks', async () => {
      mockDeleteScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.remove(VALID_UUID, ownerUser);

      expect(mockDeleteScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, ownerUser);
    });

    it('should propagate errors from DeleteScheduleUseCase', async () => {
      mockDeleteScheduleUseCase.execute.mockRejectedValue(new Error('Delete failed'));

      await expect(service.remove(VALID_UUID, adminUser)).rejects.toThrow('Delete failed');
    });
  });

  // -----------------------------------------------------------
  // Security: Authorization / IDOR
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('Authorization - user payload forwarding', () => {
      it('should forward admin user to create use case', async () => {
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(createDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, adminUser);
      });

      it('should forward owner user to create use case', async () => {
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(createDto, ownerUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, ownerUser);
      });

      it('should forward employee user to create use case', async () => {
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(createDto, employeeUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, employeeUser);
      });

      it('should forward regular user to create use case (use case should reject)', async () => {
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(createDto, regularUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, regularUser);
      });

      it('should forward attacker user to findAll for shop scope enforcement in use case', async () => {
        mockFindAllScheduleUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findAll({ shopId: SHOP_ID }, attackerUser);

        expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith({ shopId: SHOP_ID }, attackerUser);
      });

      it('should forward user to findOne for ownership check in use case', async () => {
        mockFindScheduleByIdUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.findOne(VALID_UUID, attackerUser);

        expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledWith(VALID_UUID, attackerUser);
      });

      it('should forward user to update for ownership check in use case', async () => {
        mockUpdateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.update(VALID_UUID, updateDto, attackerUser);

        expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, updateDto, attackerUser);
      });

      it('should forward user to remove for ownership check in use case', async () => {
        mockDeleteScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.remove(VALID_UUID, attackerUser);

        expect(mockDeleteScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, attackerUser);
      });
    });

    describe('IDOR - shopId scope', () => {
      it('should pass different shopId to create - use case enforces scope', async () => {
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        const dtoOtherShop: CreateScheduleDto = { ...createDto, shopId: OTHER_SHOP_ID };
        await service.create(dtoOtherShop, employeeUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(dtoOtherShop, employeeUser);
      });

      it('should pass attacker shopId to findAll - use case enforces scope', async () => {
        mockFindAllScheduleUseCase.execute.mockResolvedValue({ data: [], meta: {} });

        await service.findAll({ shopId: OTHER_SHOP_ID }, attackerUser);

        expect(mockFindAllScheduleUseCase.execute).toHaveBeenCalledWith(
          { shopId: OTHER_SHOP_ID },
          attackerUser,
        );
      });

      it('should allow findPublicByShopId with any shopId since it is public', async () => {
        mockFindPublicSchedulesUseCase.execute.mockResolvedValue([]);

        await service.findPublicByShopId(OTHER_SHOP_ID);

        expect(mockFindPublicSchedulesUseCase.execute).toHaveBeenCalledWith(OTHER_SHOP_ID);
      });
    });

    describe('Input validation edge cases', () => {
      it('should forward SQL-injection-like id to use case', async () => {
        const maliciousId = "'; DROP TABLE schedules; --";
        mockFindScheduleByIdUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

        await expect(service.findOne(maliciousId, adminUser)).rejects.toThrow('Schedule not found!');
        expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledWith(maliciousId, adminUser);
      });

      it('should forward empty string id to use case', async () => {
        mockFindScheduleByIdUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

        await expect(service.findOne('', adminUser)).rejects.toThrow('Schedule not found!');
        expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledWith('', adminUser);
      });

      it('should forward path traversal-like id to use case', async () => {
        const maliciousId = '../../../etc/passwd';
        mockFindScheduleByIdUseCase.execute.mockRejectedValue(new Error('Schedule not found!'));

        await expect(service.findOne(maliciousId, adminUser)).rejects.toThrow('Schedule not found!');
      });

      it('should forward empty shopId to findPublicByShopId', async () => {
        mockFindPublicSchedulesUseCase.execute.mockResolvedValue([]);

        await service.findPublicByShopId('');

        expect(mockFindPublicSchedulesUseCase.execute).toHaveBeenCalledWith('');
      });
    });

    describe('Data tampering', () => {
      it('should forward DTO with extra fields to use case', async () => {
        const tamperedDto = {
          ...createDto,
          id: 'tampered-id',
          createdAt: new Date('2000-01-01'),
        } as any;
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(tamperedDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(tamperedDto, adminUser);
      });

      it('should forward update DTO attempting to change shopId (DTO validation should strip it)', async () => {
        const tamperedUpdate = {
          ...updateDto,
          shopId: OTHER_SHOP_ID,
          weekday: Weekday.SUNDAY,
        } as any;
        mockUpdateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.update(VALID_UUID, tamperedUpdate, adminUser);

        expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, tamperedUpdate, adminUser);
      });

      it('should forward tampered user payload to use case', async () => {
        const tamperedUser: JwtPayload = {
          id: ATTACKER_USER_ID,
          email: 'attacker@evil.com',
          phone: '11000000000',
          role: 'ADMIN', // Trying to escalate privileges
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(createDto, tamperedUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(createDto, tamperedUser);
      });

      it('should forward DTO with __proto__ pollution attempt to use case', async () => {
        const pollutedDto = {
          ...createDto,
          ['__proto__']: { isAdmin: true },
        } as any;
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(pollutedDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });

    describe('Weekday validation', () => {
      it('should forward invalid weekday string to use case (DTO validation should catch)', async () => {
        const invalidDto = {
          ...createDto,
          weekday: 'INVALID_DAY' as any,
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward lowercase weekday to use case (DTO validation should catch)', async () => {
        const invalidDto = {
          ...createDto,
          weekday: 'monday' as any,
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward numeric weekday to use case (DTO validation should catch)', async () => {
        const invalidDto = {
          ...createDto,
          weekday: 1 as any,
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward empty string weekday to use case', async () => {
        const invalidDto = {
          ...createDto,
          weekday: '' as any,
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });
    });

    describe('Time format validation', () => {
      it('should forward malformed startTime to use case (DTO validation should catch)', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '25:00',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward time with seconds to use case', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '08:00:00',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward negative time to use case', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '-01:00',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward empty string times to use case', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '',
          endTime: '',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto as any, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward XSS-like time string to use case', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '<script>alert(1)</script>',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto as any, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward time string with only hours to use case', async () => {
        const invalidDto = {
          ...createDto,
          startTime: '08',
        };
        mockCreateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

        await service.create(invalidDto as any, adminUser);

        expect(mockCreateScheduleUseCase.execute).toHaveBeenCalledWith(invalidDto, adminUser);
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle create returning null', async () => {
      mockCreateScheduleUseCase.execute.mockResolvedValue(null);

      const result = await service.create(createDto, adminUser);

      expect(result).toBeNull();
    });

    it('should handle findAll returning empty data', async () => {
      const emptyResult = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
      mockFindAllScheduleUseCase.execute.mockResolvedValue(emptyResult);

      const result = await service.findAll({}, adminUser);

      expect(result).toEqual(emptyResult);
    });

    it('should handle update with empty DTO', async () => {
      const emptyDto: UpdateScheduleDto = {};
      mockUpdateScheduleUseCase.execute.mockResolvedValue(sampleSchedule);

      await service.update(VALID_UUID, emptyDto, adminUser);

      expect(mockUpdateScheduleUseCase.execute).toHaveBeenCalledWith(VALID_UUID, emptyDto, adminUser);
    });

    it('should handle concurrent calls without interference', async () => {
      mockFindScheduleByIdUseCase.execute
        .mockResolvedValueOnce({ ...sampleSchedule, id: 'first' })
        .mockResolvedValueOnce({ ...sampleSchedule, id: 'second' });

      const [first, second] = await Promise.all([
        service.findOne('id-1', adminUser),
        service.findOne('id-2', ownerUser),
      ]);

      expect(first.id).toBe('first');
      expect(second.id).toBe('second');
      expect(mockFindScheduleByIdUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle findPublicByShopId returning many schedules (all weekdays)', async () => {
      const allDays = Object.values(Weekday).map((day) => ({
        ...sampleSchedule,
        weekday: day,
      }));
      mockFindPublicSchedulesUseCase.execute.mockResolvedValue(allDays);

      const result = await service.findPublicByShopId(SHOP_ID);

      expect(result).toHaveLength(7);
    });
  });
});
