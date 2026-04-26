import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from '../schedule.controller';
import { ScheduleService } from '../schedule.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Weekday } from '../types/Weekday';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockScheduleService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findPublicByShopId: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

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

const managerUser: JwtPayload = {
  id: USER_ID,
  email: 'manager@example.com',
  phone: '11666666666',
  role: 'MANAGER',
};

const regularUser: JwtPayload = {
  id: USER_ID,
  email: 'user@example.com',
  phone: '11555555555',
  role: 'USER',
};

const attackerUser: JwtPayload = {
  id: ATTACKER_USER_ID,
  email: 'attacker@example.com',
  phone: '11444444444',
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
describe('ScheduleController', () => {
  let controller: ScheduleController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        { provide: ScheduleService, useValue: mockScheduleService },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to scheduleService.create with DTO and user', async () => {
      mockScheduleService.create.mockResolvedValue(sampleSchedule);

      const result = await controller.create(createDto, adminUser);

      expect(mockScheduleService.create).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should pass owner user context to service', async () => {
      mockScheduleService.create.mockResolvedValue(sampleSchedule);

      await controller.create(createDto, ownerUser);

      expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, ownerUser);
    });

    it('should pass employee user context to service', async () => {
      mockScheduleService.create.mockResolvedValue(sampleSchedule);

      await controller.create(createDto, employeeUser);

      expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, employeeUser);
    });

    it('should pass manager user context to service', async () => {
      mockScheduleService.create.mockResolvedValue(sampleSchedule);

      await controller.create(createDto, managerUser);

      expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, managerUser);
    });

    it('should propagate errors from the service', async () => {
      mockScheduleService.create.mockRejectedValue(new BadRequestException('endTime must be after startTime'));

      await expect(controller.create(createDto, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('should propagate conflict errors from the service', async () => {
      mockScheduleService.create.mockRejectedValue(new Error('Schedule already exists for this weekday'));

      await expect(controller.create(createDto, adminUser)).rejects.toThrow(
        'Schedule already exists for this weekday',
      );
    });

    it('should create schedule for each valid weekday', async () => {
      for (const weekday of Object.values(Weekday)) {
        mockScheduleService.create.mockResolvedValue({ ...sampleSchedule, weekday });

        const dto: CreateScheduleDto = { ...createDto, weekday };
        const result = await controller.create(dto, adminUser);

        expect(result.weekday).toBe(weekday);
      }

      expect(mockScheduleService.create).toHaveBeenCalledTimes(7);
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

    it('should delegate to scheduleService.findAll with parsed filters and user', async () => {
      mockScheduleService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(adminUser, SHOP_ID, '2', '20');

      expect(mockScheduleService.findAll).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: SHOP_ID, page: 2, perPage: 20 },
        adminUser,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should pass undefined for shopId, page, perPage when not provided', async () => {
      mockScheduleService.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll(adminUser);

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should parse page and perPage from strings to integers', async () => {
      mockScheduleService.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll(adminUser, undefined, '5', '50');

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: 5, perPage: 50 },
        adminUser,
      );
    });

    it('should pass NaN when page is non-numeric string', async () => {
      mockScheduleService.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll(adminUser, undefined, 'abc', 'xyz');

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: NaN, perPage: NaN },
        adminUser,
      );
    });

    it('should pass only shopId when page and perPage not provided', async () => {
      mockScheduleService.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll(adminUser, SHOP_ID);

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: SHOP_ID, page: undefined, perPage: undefined },
        adminUser,
      );
    });

    it('should propagate errors from the service', async () => {
      mockScheduleService.findAll.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.findAll(adminUser, SHOP_ID)).rejects.toThrow('Service unavailable');
    });
  });

  // -----------------------------------------------------------
  // findPublicByShopId
  // -----------------------------------------------------------
  describe('findPublicByShopId', () => {
    const publicSchedules = [sampleSchedule];

    it('should delegate to scheduleService.findPublicByShopId with shopId', async () => {
      mockScheduleService.findPublicByShopId.mockResolvedValue(publicSchedules);

      const result = await controller.findPublicByShopId(SHOP_ID);

      expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledWith(SHOP_ID);
      expect(result).toEqual(publicSchedules);
    });

    it('should not require user authentication (public endpoint)', async () => {
      mockScheduleService.findPublicByShopId.mockResolvedValue(publicSchedules);

      // The method signature does not include a user parameter
      const result = await controller.findPublicByShopId(SHOP_ID);

      expect(result).toBeDefined();
      expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledWith(SHOP_ID);
    });

    it('should propagate errors from the service', async () => {
      mockScheduleService.findPublicByShopId.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.findPublicByShopId(SHOP_ID)).rejects.toThrow('Service unavailable');
    });

    it('should return empty array when no schedules found', async () => {
      mockScheduleService.findPublicByShopId.mockResolvedValue([]);

      const result = await controller.findPublicByShopId(SHOP_ID);

      expect(result).toEqual([]);
    });

    it('should return all weekday schedules', async () => {
      const allDays = Object.values(Weekday).map((day) => ({
        ...sampleSchedule,
        weekday: day,
      }));
      mockScheduleService.findPublicByShopId.mockResolvedValue(allDays);

      const result = await controller.findPublicByShopId(SHOP_ID);

      expect(result).toHaveLength(7);
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to scheduleService.findOne with id and user', async () => {
      mockScheduleService.findOne.mockResolvedValue(sampleSchedule);

      const result = await controller.findOne(VALID_UUID, adminUser);

      expect(mockScheduleService.findOne).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.findOne).toHaveBeenCalledWith(VALID_UUID, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should propagate NotFoundException from the service', async () => {
      mockScheduleService.findOne.mockRejectedValue(new NotFoundException('Schedule not found!'));

      await expect(controller.findOne('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should pass different user contexts', async () => {
      mockScheduleService.findOne.mockResolvedValue(sampleSchedule);

      await controller.findOne(VALID_UUID, ownerUser);

      expect(mockScheduleService.findOne).toHaveBeenCalledWith(VALID_UUID, ownerUser);
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to scheduleService.update with id, DTO, and user', async () => {
      const updatedSchedule = { ...sampleSchedule, ...updateDto };
      mockScheduleService.update.mockResolvedValue(updatedSchedule);

      const result = await controller.update(VALID_UUID, updateDto, adminUser);

      expect(mockScheduleService.update).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, updateDto, adminUser);
      expect(result).toEqual(updatedSchedule);
    });

    it('should propagate NotFoundException from the service', async () => {
      mockScheduleService.update.mockRejectedValue(new NotFoundException('Schedule not found!'));

      await expect(controller.update('bad-id', updateDto, adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for invalid time ranges', async () => {
      mockScheduleService.update.mockRejectedValue(
        new BadRequestException('startTime must be before endTime'),
      );

      await expect(controller.update(VALID_UUID, updateDto, adminUser)).rejects.toThrow(BadRequestException);
    });

    it('should allow partial update with empty DTO', async () => {
      mockScheduleService.update.mockResolvedValue(sampleSchedule);

      await controller.update(VALID_UUID, {}, adminUser);

      expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, {}, adminUser);
    });

    it('should allow update with only break times', async () => {
      const breakDto: UpdateScheduleDto = {
        breakStartTime: '12:30',
        breakEndTime: '13:30',
      };
      mockScheduleService.update.mockResolvedValue({ ...sampleSchedule, ...breakDto });

      await controller.update(VALID_UUID, breakDto, adminUser);

      expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, breakDto, adminUser);
    });

    it('should allow update with isOpen status change', async () => {
      const statusDto: UpdateScheduleDto = { isOpen: 'INACTIVE' as any };
      mockScheduleService.update.mockResolvedValue({ ...sampleSchedule, isOpen: 'INACTIVE' });

      await controller.update(VALID_UUID, statusDto, adminUser);

      expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, statusDto, adminUser);
    });

    it('should forward user context for all role types', async () => {
      mockScheduleService.update.mockResolvedValue(sampleSchedule);

      for (const user of [adminUser, ownerUser, employeeUser, managerUser]) {
        await controller.update(VALID_UUID, updateDto, user);
      }

      expect(mockScheduleService.update).toHaveBeenCalledTimes(4);
      expect(mockScheduleService.update).toHaveBeenNthCalledWith(1, VALID_UUID, updateDto, adminUser);
      expect(mockScheduleService.update).toHaveBeenNthCalledWith(2, VALID_UUID, updateDto, ownerUser);
      expect(mockScheduleService.update).toHaveBeenNthCalledWith(3, VALID_UUID, updateDto, employeeUser);
      expect(mockScheduleService.update).toHaveBeenNthCalledWith(4, VALID_UUID, updateDto, managerUser);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to scheduleService.remove with id and user', async () => {
      mockScheduleService.remove.mockResolvedValue(sampleSchedule);

      const result = await controller.remove(VALID_UUID, adminUser);

      expect(mockScheduleService.remove).toHaveBeenCalledTimes(1);
      expect(mockScheduleService.remove).toHaveBeenCalledWith(VALID_UUID, adminUser);
      expect(result).toEqual(sampleSchedule);
    });

    it('should propagate NotFoundException from the service', async () => {
      mockScheduleService.remove.mockRejectedValue(new NotFoundException('Schedule not found!'));

      await expect(controller.remove('bad-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should pass user context for authorization in the service', async () => {
      mockScheduleService.remove.mockResolvedValue(sampleSchedule);

      await controller.remove(VALID_UUID, ownerUser);

      expect(mockScheduleService.remove).toHaveBeenCalledWith(VALID_UUID, ownerUser);
    });

    it('should propagate errors from the service', async () => {
      mockScheduleService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(VALID_UUID, adminUser)).rejects.toThrow('Delete failed');
    });
  });

  // -----------------------------------------------------------
  // Security
  // -----------------------------------------------------------
  describe('Security', () => {
    describe('Authorization - role-based access', () => {
      it('should accept admin user and forward to service', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, adminUser);
      });

      it('should accept owner user and forward to service', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, ownerUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, ownerUser);
      });

      it('should accept employee user and forward to service', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, employeeUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, employeeUser);
      });

      it('should accept manager user and forward to service', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, managerUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, managerUser);
      });

      it('should still forward regular USER role to service (guard should have blocked)', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, regularUser);

        // The Roles decorator handles this at guard level, not controller method level
        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, regularUser);
      });
    });

    describe('IDOR - shopId scope enforcement', () => {
      it('should pass attacker shopId in create DTO to service', async () => {
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        const dtoOtherShop: CreateScheduleDto = { ...createDto, shopId: OTHER_SHOP_ID };
        await controller.create(dtoOtherShop, attackerUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(dtoOtherShop, attackerUser);
      });

      it('should pass attacker shopId in findAll query to service', async () => {
        mockScheduleService.findAll.mockResolvedValue({ data: [], meta: {} });

        await controller.findAll(attackerUser, OTHER_SHOP_ID);

        expect(mockScheduleService.findAll).toHaveBeenCalledWith(
          { shopId: OTHER_SHOP_ID, page: undefined, perPage: undefined },
          attackerUser,
        );
      });

      it('should allow any shopId in public endpoint', async () => {
        mockScheduleService.findPublicByShopId.mockResolvedValue([]);

        await controller.findPublicByShopId(OTHER_SHOP_ID);

        expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledWith(OTHER_SHOP_ID);
      });

      it('should pass attacker user to findOne for another shops schedule', async () => {
        mockScheduleService.findOne.mockResolvedValue(sampleSchedule);

        await controller.findOne(VALID_UUID, attackerUser);

        expect(mockScheduleService.findOne).toHaveBeenCalledWith(VALID_UUID, attackerUser);
      });

      it('should pass attacker user to update for another shops schedule', async () => {
        mockScheduleService.update.mockResolvedValue(sampleSchedule);

        await controller.update(VALID_UUID, updateDto, attackerUser);

        expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, updateDto, attackerUser);
      });

      it('should pass attacker user to remove for another shops schedule', async () => {
        mockScheduleService.remove.mockResolvedValue(sampleSchedule);

        await controller.remove(VALID_UUID, attackerUser);

        expect(mockScheduleService.remove).toHaveBeenCalledWith(VALID_UUID, attackerUser);
      });
    });

    describe('Input validation edge cases', () => {
      it('should forward SQL-injection-like id to service', async () => {
        const maliciousId = "'; DROP TABLE schedules; --";
        mockScheduleService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne(maliciousId, adminUser)).rejects.toThrow(NotFoundException);
        expect(mockScheduleService.findOne).toHaveBeenCalledWith(maliciousId, adminUser);
      });

      it('should forward empty string id to service', async () => {
        mockScheduleService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne('', adminUser)).rejects.toThrow(NotFoundException);
        expect(mockScheduleService.findOne).toHaveBeenCalledWith('', adminUser);
      });

      it('should forward path traversal-like id to service', async () => {
        const maliciousId = '../../../etc/passwd';
        mockScheduleService.findOne.mockRejectedValue(new NotFoundException());

        await expect(controller.findOne(maliciousId, adminUser)).rejects.toThrow(NotFoundException);
      });

      it('should forward empty shopId to findPublicByShopId', async () => {
        mockScheduleService.findPublicByShopId.mockResolvedValue([]);

        await controller.findPublicByShopId('');

        expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledWith('');
      });

      it('should forward SQL-injection-like shopId to findPublicByShopId', async () => {
        const maliciousShopId = "'; DROP TABLE shops; --";
        mockScheduleService.findPublicByShopId.mockResolvedValue([]);

        await controller.findPublicByShopId(maliciousShopId);

        expect(mockScheduleService.findPublicByShopId).toHaveBeenCalledWith(maliciousShopId);
      });
    });

    describe('Data tampering', () => {
      it('should forward DTO with extra fields to service', async () => {
        const tamperedDto = {
          ...createDto,
          id: 'tampered-id',
          createdAt: new Date('2000-01-01'),
        } as any;
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(tamperedDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(tamperedDto, adminUser);
      });

      it('should forward update DTO attempting to change shopId and weekday', async () => {
        const tamperedUpdate = {
          ...updateDto,
          shopId: OTHER_SHOP_ID,
          weekday: Weekday.SUNDAY,
        } as any;
        mockScheduleService.update.mockResolvedValue(sampleSchedule);

        await controller.update(VALID_UUID, tamperedUpdate, adminUser);

        expect(mockScheduleService.update).toHaveBeenCalledWith(VALID_UUID, tamperedUpdate, adminUser);
      });

      it('should forward tampered user payload (role escalation attempt)', async () => {
        const tamperedUser: JwtPayload = {
          id: ATTACKER_USER_ID,
          email: 'attacker@evil.com',
          phone: '11000000000',
          role: 'ADMIN',
        };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(createDto, tamperedUser);

        // Controller passes whatever user comes from decorator;
        // JWT guard should prevent actual tampering.
        expect(mockScheduleService.create).toHaveBeenCalledWith(createDto, tamperedUser);
      });
    });

    describe('Weekday validation', () => {
      it('should forward invalid weekday in DTO to service', async () => {
        const invalidDto = { ...createDto, weekday: 'INVALID_DAY' as any };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward lowercase weekday in DTO to service', async () => {
        const invalidDto = { ...createDto, weekday: 'monday' as any };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward numeric weekday in DTO to service', async () => {
        const invalidDto = { ...createDto, weekday: 1 as any };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });
    });

    describe('Time format validation', () => {
      it('should forward malformed startTime to service', async () => {
        const invalidDto = { ...createDto, startTime: '25:00' };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward negative time to service', async () => {
        const invalidDto = { ...createDto, startTime: '-01:00' };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward XSS-like time string to service', async () => {
        const invalidDto = { ...createDto, startTime: '<script>alert(1)</script>' };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward time with seconds to service', async () => {
        const invalidDto = { ...createDto, startTime: '08:00:00' };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward empty string time to service', async () => {
        const invalidDto = { ...createDto, startTime: '', endTime: '' };
        mockScheduleService.create.mockResolvedValue(sampleSchedule);

        await controller.create(invalidDto, adminUser);

        expect(mockScheduleService.create).toHaveBeenCalledWith(invalidDto, adminUser);
      });

      it('should forward update DTO with endTime before startTime to service', async () => {
        const invalidUpdateDto: UpdateScheduleDto = {
          startTime: '18:00',
          endTime: '08:00',
        };
        mockScheduleService.update.mockRejectedValue(
          new BadRequestException('startTime must be before endTime'),
        );

        await expect(controller.update(VALID_UUID, invalidUpdateDto, adminUser)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should forward update DTO with break outside working hours to service', async () => {
        const invalidUpdateDto: UpdateScheduleDto = {
          breakStartTime: '07:00',
          breakEndTime: '08:00',
        };
        mockScheduleService.update.mockRejectedValue(
          new BadRequestException('Break time must be within working hours'),
        );

        await expect(controller.update(VALID_UUID, invalidUpdateDto, adminUser)).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle findAll with page=0 string', async () => {
      mockScheduleService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(adminUser, undefined, '0', '0');

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: 0, perPage: 0 },
        adminUser,
      );
    });

    it('should handle findAll with very large page numbers', async () => {
      mockScheduleService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(adminUser, undefined, '999999', '999999');

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: 999999, perPage: 999999 },
        adminUser,
      );
    });

    it('should handle findAll with negative page numbers', async () => {
      mockScheduleService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(adminUser, undefined, '-1', '-5');

      expect(mockScheduleService.findAll).toHaveBeenCalledWith(
        { shopId: undefined, page: -1, perPage: -5 },
        adminUser,
      );
    });

    it('should handle concurrent requests without interference', async () => {
      mockScheduleService.findOne
        .mockResolvedValueOnce({ ...sampleSchedule, id: 'first' })
        .mockResolvedValueOnce({ ...sampleSchedule, id: 'second' });

      const [first, second] = await Promise.all([
        controller.findOne('id-1', adminUser),
        controller.findOne('id-2', ownerUser),
      ]);

      expect(first.id).toBe('first');
      expect(second.id).toBe('second');
    });

    it('should handle create with all optional fields undefined', async () => {
      const minimalDto: CreateScheduleDto = {
        weekday: Weekday.WEDNESDAY,
        startTime: '08:00',
        endTime: '18:00',
        shopId: SHOP_ID,
      };
      mockScheduleService.create.mockResolvedValue({ ...sampleSchedule, ...minimalDto });

      const result = await controller.create(minimalDto, adminUser);

      expect(result).toBeDefined();
      expect(mockScheduleService.create).toHaveBeenCalledWith(minimalDto, adminUser);
    });

    it('should handle update returning updated schedule with all fields', async () => {
      const fullUpdateDto: UpdateScheduleDto = {
        startTime: '07:00',
        endTime: '19:00',
        breakStartTime: '11:30',
        breakEndTime: '12:30',
        isOpen: 'ACTIVE' as any,
      };
      const updatedSchedule = { ...sampleSchedule, ...fullUpdateDto };
      mockScheduleService.update.mockResolvedValue(updatedSchedule);

      const result = await controller.update(VALID_UUID, fullUpdateDto, adminUser);

      expect(result.startTime).toBe('07:00');
      expect(result.endTime).toBe('19:00');
      expect(result.breakStartTime).toBe('11:30');
      expect(result.breakEndTime).toBe('12:30');
    });
  });
});
