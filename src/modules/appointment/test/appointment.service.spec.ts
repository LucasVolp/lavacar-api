import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from '../appointment.service';
import {
    CreateAppointmentUseCase,
    FindAllAppointmentUseCase,
    FindAppointmentByIdUseCase,
    UpdateAppointmentUseCase,
    CancelAppointmentUseCase,
    FindPublicAppointmentsByDateUseCase,
    FindPublicAvailabilityUseCase,
    CreateWalkInAppointmentUseCase,
    FindAppointmentsByVehiclePlateUseCase,
    ConfirmAppointmentByTrackingUseCase,
    CancelAppointmentByTrackingUseCase,
} from '../use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { AppointmentStatus } from '../types/AppointmentStatus';

// ── Mocks ──────────────────────────────────────────────────────────
const mockCreateAppointmentUseCase = { execute: jest.fn() };
const mockFindAllAppointmentUseCase = { execute: jest.fn() };
const mockFindAppointmentByIdUseCase = { execute: jest.fn() };
const mockUpdateAppointmentUseCase = { execute: jest.fn() };
const mockCancelAppointmentUseCase = { execute: jest.fn() };
const mockFindPublicAppointmentsByDateUseCase = { execute: jest.fn() };
const mockFindPublicAvailabilityUseCase = { execute: jest.fn() };
const mockCreateWalkInAppointmentUseCase = { execute: jest.fn() };
const mockFindAppointmentsByVehiclePlateUseCase = { execute: jest.fn() };
const mockConfirmAppointmentByTrackingUseCase = { execute: jest.fn() };
const mockCancelAppointmentByTrackingUseCase = { execute: jest.fn() };

// ── Test fixtures ──────────────────────────────────────────────────
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511999990000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511999990001', role: 'OWNER' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511999990002', role: 'USER' };
const otherUser: JwtPayload = { id: 'user-2', email: 'other@test.com', phone: '+5511999990003', role: 'USER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511999990004', role: 'EMPLOYEE' };

const mockAppointment = {
    id: 'appt-1',
    scheduledAt: new Date('2026-04-01T10:00:00Z'),
    endTime: new Date('2026-04-01T11:00:00Z'),
    totalPrice: 100,
    totalDuration: 60,
    status: AppointmentStatus.PENDING,
    userId: 'user-1',
    shopId: 'shop-1',
    vehicleId: 'vehicle-1',
    notes: null,
};

const mockCreateDto = {
    scheduledAt: '2026-04-01T10:00:00Z',
    endTime: '2026-04-01T11:00:00Z',
    totalPrice: 100,
    totalDuration: 60,
    userId: 'user-1',
    shopId: 'shop-1',
    vehicleId: 'vehicle-1',
    serviceIds: [
        { serviceId: 'svc-1', serviceName: 'Wash', servicePrice: 50, duration: 30 },
        { serviceId: 'svc-2', serviceName: 'Wax', servicePrice: 50, duration: 30 },
    ],
};

const mockWalkInDto = {
    shopId: 'shop-1',
    user: { firstName: 'John', phone: '+5511999990002' },
    vehicle: { brand: 'Toyota', model: 'Corolla' },
    serviceIds: ['svc-1'],
};

describe('AppointmentService', () => {
    let service: AppointmentService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppointmentService,
                { provide: CreateAppointmentUseCase, useValue: mockCreateAppointmentUseCase },
                { provide: FindAllAppointmentUseCase, useValue: mockFindAllAppointmentUseCase },
                { provide: FindAppointmentByIdUseCase, useValue: mockFindAppointmentByIdUseCase },
                { provide: UpdateAppointmentUseCase, useValue: mockUpdateAppointmentUseCase },
                { provide: CancelAppointmentUseCase, useValue: mockCancelAppointmentUseCase },
                { provide: FindPublicAppointmentsByDateUseCase, useValue: mockFindPublicAppointmentsByDateUseCase },
                { provide: FindPublicAvailabilityUseCase, useValue: mockFindPublicAvailabilityUseCase },
                { provide: CreateWalkInAppointmentUseCase, useValue: mockCreateWalkInAppointmentUseCase },
                { provide: FindAppointmentsByVehiclePlateUseCase, useValue: mockFindAppointmentsByVehiclePlateUseCase },
                { provide: ConfirmAppointmentByTrackingUseCase, useValue: mockConfirmAppointmentByTrackingUseCase },
                { provide: CancelAppointmentByTrackingUseCase, useValue: mockCancelAppointmentByTrackingUseCase },
            ],
        }).compile();

        service = module.get<AppointmentService>(AppointmentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // -----------------------------------------------------------
    // create
    // -----------------------------------------------------------
    describe('create', () => {
        it('should delegate to CreateAppointmentUseCase with data and user context', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            const result = await service.create(mockCreateDto as any, regularUser);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                { id: regularUser.id, role: regularUser.role },
            );
            expect(result).toEqual(mockAppointment);
        });

        it('should pass undefined when no user is provided (guest booking)', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            const result = await service.create(mockCreateDto as any);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                undefined,
            );
            expect(result).toEqual(mockAppointment);
        });

        it('should pass ADMIN role to use case for internal operations', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            await service.create(mockCreateDto as any, adminUser);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                { id: 'admin-1', role: 'ADMIN' },
            );
        });

        it('should pass OWNER role to use case', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            await service.create(mockCreateDto as any, ownerUser);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                { id: 'owner-1', role: 'OWNER' },
            );
        });

        it('should pass EMPLOYEE role to use case', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            await service.create(mockCreateDto as any, employeeUser);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                { id: 'emp-1', role: 'EMPLOYEE' },
            );
        });

        it('should propagate errors from CreateAppointmentUseCase', async () => {
            mockCreateAppointmentUseCase.execute.mockRejectedValue(new Error('Conflict'));

            await expect(service.create(mockCreateDto as any, regularUser)).rejects.toThrow('Conflict');
        });
    });

    // -----------------------------------------------------------
    // findAll
    // -----------------------------------------------------------
    describe('findAll', () => {
        const mockPaginatedResult = {
            data: [mockAppointment],
            meta: { total: 1, page: 1, perPage: 10 },
        };

        it('should delegate to FindAllAppointmentUseCase with filters and user', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = { shopId: 'shop-1', status: AppointmentStatus.PENDING };

            const result = await service.findAll(filters, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(filters, regularUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should pass empty filters when none provided', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);

            const result = await service.findAll({}, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith({}, regularUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should pass default empty object when filters is undefined', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);

            const result = await service.findAll(undefined, regularUser);

            // The service has a default parameter = {}, so undefined becomes {}
            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith({}, regularUser);
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should support multiple status filters', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = {
                shopId: 'shop-1',
                status: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
            };

            await service.findAll(filters, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(filters, regularUser);
        });

        it('should support date range filters', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = { startDate: '2026-04-01', endDate: '2026-04-30' };

            await service.findAll(filters, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(filters, regularUser);
        });

        it('should support pagination filters', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue(mockPaginatedResult);
            const filters = { page: 2, perPage: 20, sortOrder: 'desc' as const };

            await service.findAll(filters, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(filters, regularUser);
        });

        it('should propagate errors from FindAllAppointmentUseCase', async () => {
            mockFindAllAppointmentUseCase.execute.mockRejectedValue(new Error('DB error'));

            await expect(service.findAll({}, regularUser)).rejects.toThrow('DB error');
        });
    });

    // -----------------------------------------------------------
    // findOne
    // -----------------------------------------------------------
    describe('findOne', () => {
        it('should delegate to FindAppointmentByIdUseCase with id and user', async () => {
            mockFindAppointmentByIdUseCase.execute.mockResolvedValue(mockAppointment);

            const result = await service.findOne('appt-1', regularUser);

            expect(mockFindAppointmentByIdUseCase.execute).toHaveBeenCalledWith('appt-1', regularUser);
            expect(result).toEqual(mockAppointment);
        });

        it('should propagate NotFoundException from use case', async () => {
            mockFindAppointmentByIdUseCase.execute.mockRejectedValue(new Error('Appointment not found'));

            await expect(service.findOne('nonexistent', regularUser)).rejects.toThrow('Appointment not found');
        });

        it('should pass user context for authorization scoping', async () => {
            mockFindAppointmentByIdUseCase.execute.mockResolvedValue(mockAppointment);

            await service.findOne('appt-1', otherUser);

            expect(mockFindAppointmentByIdUseCase.execute).toHaveBeenCalledWith('appt-1', otherUser);
        });

        it('should pass admin user context', async () => {
            mockFindAppointmentByIdUseCase.execute.mockResolvedValue(mockAppointment);

            await service.findOne('appt-1', adminUser);

            expect(mockFindAppointmentByIdUseCase.execute).toHaveBeenCalledWith('appt-1', adminUser);
        });
    });

    // -----------------------------------------------------------
    // update
    // -----------------------------------------------------------
    describe('update', () => {
        it('should delegate to UpdateAppointmentUseCase with id, data, and user', async () => {
            const updateDto = { status: AppointmentStatus.CONFIRMED };
            const updated = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
            mockUpdateAppointmentUseCase.execute.mockResolvedValue(updated);

            const result = await service.update('appt-1', updateDto as any, regularUser);

            expect(mockUpdateAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', updateDto, regularUser);
            expect(result).toEqual(updated);
        });

        it('should forward notes update', async () => {
            const updateDto = { notes: 'Updated notes' };
            mockUpdateAppointmentUseCase.execute.mockResolvedValue({ ...mockAppointment, notes: 'Updated notes' });

            await service.update('appt-1', updateDto as any, regularUser);

            expect(mockUpdateAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', updateDto, regularUser);
        });

        it('should forward cancellationReason update', async () => {
            const updateDto = { status: AppointmentStatus.CANCELED, cancellationReason: 'No longer needed' };
            mockUpdateAppointmentUseCase.execute.mockResolvedValue({
                ...mockAppointment,
                status: AppointmentStatus.CANCELED,
            });

            await service.update('appt-1', updateDto as any, regularUser);

            expect(mockUpdateAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', updateDto, regularUser);
        });

        it('should propagate errors from UpdateAppointmentUseCase', async () => {
            mockUpdateAppointmentUseCase.execute.mockRejectedValue(new Error('Not found'));

            await expect(
                service.update('nonexistent', { status: AppointmentStatus.CONFIRMED } as any, regularUser),
            ).rejects.toThrow('Not found');
        });
    });

    // -----------------------------------------------------------
    // cancel
    // -----------------------------------------------------------
    describe('cancel', () => {
        it('should delegate to CancelAppointmentUseCase with id, reason, and user', async () => {
            const cancelResult = { message: 'Appointment canceled successfully', appointment: mockAppointment };
            mockCancelAppointmentUseCase.execute.mockResolvedValue(cancelResult);

            const result = await service.cancel('appt-1', regularUser, 'No longer needed');

            expect(mockCancelAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', 'No longer needed', regularUser);
            expect(result).toEqual(cancelResult);
        });

        it('should work without a reason', async () => {
            const cancelResult = { message: 'Appointment canceled successfully', appointment: mockAppointment };
            mockCancelAppointmentUseCase.execute.mockResolvedValue(cancelResult);

            await service.cancel('appt-1', regularUser);

            expect(mockCancelAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', undefined, regularUser);
        });

        it('should propagate errors from CancelAppointmentUseCase', async () => {
            mockCancelAppointmentUseCase.execute.mockRejectedValue(new Error('Cannot cancel'));

            await expect(service.cancel('appt-1', regularUser)).rejects.toThrow('Cannot cancel');
        });
    });

    // -----------------------------------------------------------
    // createWalkIn
    // -----------------------------------------------------------
    describe('createWalkIn', () => {
        it('should delegate to CreateWalkInAppointmentUseCase', async () => {
            const walkInAppointment = { ...mockAppointment, id: 'walkin-1', status: AppointmentStatus.WAITING };
            mockCreateWalkInAppointmentUseCase.execute.mockResolvedValue(walkInAppointment);

            const result = await service.createWalkIn(mockWalkInDto as any);

            expect(mockCreateWalkInAppointmentUseCase.execute).toHaveBeenCalledWith(mockWalkInDto);
            expect(result).toEqual(walkInAppointment);
        });

        it('should propagate errors from CreateWalkInAppointmentUseCase', async () => {
            mockCreateWalkInAppointmentUseCase.execute.mockRejectedValue(new Error('Shop not active'));

            await expect(service.createWalkIn(mockWalkInDto as any)).rejects.toThrow('Shop not active');
        });
    });

    // -----------------------------------------------------------
    // findByVehiclePlate
    // -----------------------------------------------------------
    describe('findByVehiclePlate', () => {
        it('should delegate to FindAppointmentsByVehiclePlateUseCase', async () => {
            const appointments = [mockAppointment];
            mockFindAppointmentsByVehiclePlateUseCase.execute.mockResolvedValue(appointments);

            const result = await service.findByVehiclePlate('ABC1D23', 'shop-1');

            expect(mockFindAppointmentsByVehiclePlateUseCase.execute).toHaveBeenCalledWith('ABC1D23', 'shop-1');
            expect(result).toEqual(appointments);
        });

        it('should return empty array when no appointments found', async () => {
            mockFindAppointmentsByVehiclePlateUseCase.execute.mockResolvedValue([]);

            const result = await service.findByVehiclePlate('XYZ9Z99', 'shop-1');

            expect(result).toEqual([]);
        });

        it('should propagate errors from use case', async () => {
            mockFindAppointmentsByVehiclePlateUseCase.execute.mockRejectedValue(new Error('DB error'));

            await expect(service.findByVehiclePlate('ABC1D23', 'shop-1')).rejects.toThrow('DB error');
        });
    });

    // -----------------------------------------------------------
    // findPublicByShopAndDate
    // -----------------------------------------------------------
    describe('findPublicByShopAndDate', () => {
        it('should delegate to FindPublicAppointmentsByDateUseCase with Date object', async () => {
            const appointments = [mockAppointment];
            mockFindPublicAppointmentsByDateUseCase.execute.mockResolvedValue(appointments);

            const result = await service.findPublicByShopAndDate('shop-1', '2026-04-01');

            expect(mockFindPublicAppointmentsByDateUseCase.execute).toHaveBeenCalledWith(
                'shop-1',
                new Date('2026-04-01'),
            );
            expect(result).toEqual(appointments);
        });

        it('should convert date string to Date object', async () => {
            mockFindPublicAppointmentsByDateUseCase.execute.mockResolvedValue([]);

            await service.findPublicByShopAndDate('shop-1', '2026-12-25');

            const callArgs = mockFindPublicAppointmentsByDateUseCase.execute.mock.calls[0];
            expect(callArgs[1]).toBeInstanceOf(Date);
        });

        it('should propagate errors from use case', async () => {
            mockFindPublicAppointmentsByDateUseCase.execute.mockRejectedValue(new Error('Service unavailable'));

            await expect(service.findPublicByShopAndDate('shop-1', '2026-04-01')).rejects.toThrow('Service unavailable');
        });
    });

    // -----------------------------------------------------------
    // findPublicAvailability
    // -----------------------------------------------------------
    describe('findPublicAvailability', () => {
        const availabilityResult = {
            date: '2026-04-01',
            totalDuration: 60,
            slotInterval: 30,
            availableSlots: ['09:00', '09:30', '10:00'],
        };

        it('should delegate to FindPublicAvailabilityUseCase with correct params', async () => {
            mockFindPublicAvailabilityUseCase.execute.mockResolvedValue(availabilityResult);

            const result = await service.findPublicAvailability('shop-1', '2026-04-01', ['svc-1', 'svc-2']);

            expect(mockFindPublicAvailabilityUseCase.execute).toHaveBeenCalledWith({
                shopId: 'shop-1',
                date: '2026-04-01',
                serviceIds: ['svc-1', 'svc-2'],
            });
            expect(result).toEqual(availabilityResult);
        });

        it('should handle empty service ids', async () => {
            mockFindPublicAvailabilityUseCase.execute.mockResolvedValue({
                ...availabilityResult,
                availableSlots: [],
            });

            await service.findPublicAvailability('shop-1', '2026-04-01', []);

            expect(mockFindPublicAvailabilityUseCase.execute).toHaveBeenCalledWith({
                shopId: 'shop-1',
                date: '2026-04-01',
                serviceIds: [],
            });
        });

        it('should propagate errors from use case', async () => {
            mockFindPublicAvailabilityUseCase.execute.mockRejectedValue(new Error('Service unavailable'));

            await expect(
                service.findPublicAvailability('shop-1', '2026-04-01', ['svc-1']),
            ).rejects.toThrow('Service unavailable');
        });
    });

    // -----------------------------------------------------------
    // confirmByTracking
    // -----------------------------------------------------------
    describe('confirmByTracking', () => {
        it('should delegate to ConfirmAppointmentByTrackingUseCase with token', async () => {
            const confirmed = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
            mockConfirmAppointmentByTrackingUseCase.execute.mockResolvedValue(confirmed);

            const result = await service.confirmByTracking('valid-token');

            expect(mockConfirmAppointmentByTrackingUseCase.execute).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual(confirmed);
        });

        it('should propagate errors for invalid token', async () => {
            mockConfirmAppointmentByTrackingUseCase.execute.mockRejectedValue(new Error('Invalid token'));

            await expect(service.confirmByTracking('invalid-token')).rejects.toThrow('Invalid token');
        });
    });

    // -----------------------------------------------------------
    // cancelByTracking
    // -----------------------------------------------------------
    describe('cancelByTracking', () => {
        it('should delegate to CancelAppointmentByTrackingUseCase with token and reason', async () => {
            const canceled = { ...mockAppointment, status: AppointmentStatus.CANCELED };
            mockCancelAppointmentByTrackingUseCase.execute.mockResolvedValue(canceled);

            const result = await service.cancelByTracking('valid-token', 'Changed plans');

            expect(mockCancelAppointmentByTrackingUseCase.execute).toHaveBeenCalledWith('valid-token', 'Changed plans');
            expect(result).toEqual(canceled);
        });

        it('should work without a reason', async () => {
            const canceled = { ...mockAppointment, status: AppointmentStatus.CANCELED };
            mockCancelAppointmentByTrackingUseCase.execute.mockResolvedValue(canceled);

            await service.cancelByTracking('valid-token');

            expect(mockCancelAppointmentByTrackingUseCase.execute).toHaveBeenCalledWith('valid-token', undefined);
        });

        it('should propagate errors for invalid token', async () => {
            mockCancelAppointmentByTrackingUseCase.execute.mockRejectedValue(new Error('Invalid token'));

            await expect(service.cancelByTracking('invalid-token')).rejects.toThrow('Invalid token');
        });
    });

    // -----------------------------------------------------------
    // Security: IDOR - Insecure Direct Object Reference
    // -----------------------------------------------------------
    describe('Security: IDOR', () => {
        it('should pass user context to findOne so use case can enforce ownership', async () => {
            mockFindAppointmentByIdUseCase.execute.mockResolvedValue(mockAppointment);

            await service.findOne('appt-1', otherUser);

            // The user context is passed - it is up to the use case / repository
            // to enforce that user-2 can only see their own appointments
            expect(mockFindAppointmentByIdUseCase.execute).toHaveBeenCalledWith('appt-1', otherUser);
        });

        it('should pass user context to findAll for row-level scoping', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findAll({ userId: 'user-1' }, otherUser);

            // Even if the filter says userId=user-1, the user context (user-2) is passed
            // so the repository can enforce that user-2 cannot query user-1 appointments
            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(
                { userId: 'user-1' },
                otherUser,
            );
        });

        it('should pass user context to update for ownership verification', async () => {
            mockUpdateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            await service.update('appt-1', { status: AppointmentStatus.CONFIRMED } as any, otherUser);

            expect(mockUpdateAppointmentUseCase.execute).toHaveBeenCalledWith(
                'appt-1',
                { status: AppointmentStatus.CONFIRMED },
                otherUser,
            );
        });

        it('should pass user context to cancel for ownership verification', async () => {
            mockCancelAppointmentUseCase.execute.mockResolvedValue({ message: 'ok', appointment: mockAppointment });

            await service.cancel('appt-1', otherUser, 'reason');

            expect(mockCancelAppointmentUseCase.execute).toHaveBeenCalledWith('appt-1', 'reason', otherUser);
        });
    });

    // -----------------------------------------------------------
    // Security: Role-based behavior on create
    // -----------------------------------------------------------
    describe('Security: Role-based create behavior', () => {
        it('should strip user context for guest (no user) booking', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);

            await service.create(mockCreateDto as any, undefined);

            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(mockCreateDto, undefined);
        });

        it('should only extract id and role from user payload for create', async () => {
            mockCreateAppointmentUseCase.execute.mockResolvedValue(mockAppointment);
            const fullUser: JwtPayload = { id: 'u1', email: 'sensitive@test.com', phone: '+5511999999999', role: 'USER' };

            await service.create(mockCreateDto as any, fullUser);

            // Email and phone are NOT forwarded to the use case
            expect(mockCreateAppointmentUseCase.execute).toHaveBeenCalledWith(
                mockCreateDto,
                { id: 'u1', role: 'USER' },
            );
        });
    });

    // -----------------------------------------------------------
    // Security: Input validation (service layer passthrough)
    // -----------------------------------------------------------
    describe('Security: Input passthrough', () => {
        it('should pass plate string directly to use case (no sanitization at service level)', async () => {
            mockFindAppointmentsByVehiclePlateUseCase.execute.mockResolvedValue([]);

            await service.findByVehiclePlate('<script>alert(1)</script>', 'shop-1');

            // At the service level, the string is passed as-is; validation should happen
            // at DTO level or use case level
            expect(mockFindAppointmentsByVehiclePlateUseCase.execute).toHaveBeenCalledWith(
                '<script>alert(1)</script>',
                'shop-1',
            );
        });

        it('should pass date string directly to public availability', async () => {
            mockFindPublicAvailabilityUseCase.execute.mockResolvedValue({
                date: 'invalid',
                totalDuration: 0,
                slotInterval: 30,
                availableSlots: [],
            });

            await service.findPublicAvailability('shop-1', 'invalid-date', ['svc-1']);

            expect(mockFindPublicAvailabilityUseCase.execute).toHaveBeenCalledWith({
                shopId: 'shop-1',
                date: 'invalid-date',
                serviceIds: ['svc-1'],
            });
        });
    });

    // -----------------------------------------------------------
    // Security: Tracking token operations
    // -----------------------------------------------------------
    describe('Security: Tracking token isolation', () => {
        it('should not require user context for confirmByTracking', async () => {
            mockConfirmAppointmentByTrackingUseCase.execute.mockResolvedValue(mockAppointment);

            // confirmByTracking only takes a token, no user - the token itself is the auth
            const result = await service.confirmByTracking('some-token');
            expect(result).toEqual(mockAppointment);
        });

        it('should not require user context for cancelByTracking', async () => {
            mockCancelAppointmentByTrackingUseCase.execute.mockResolvedValue(mockAppointment);

            const result = await service.cancelByTracking('some-token');
            expect(result).toEqual(mockAppointment);
        });

        it('should propagate token validation errors', async () => {
            mockConfirmAppointmentByTrackingUseCase.execute.mockRejectedValue(new Error('Token expired'));

            await expect(service.confirmByTracking('expired-token')).rejects.toThrow('Token expired');
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('should handle empty string plate lookup', async () => {
            mockFindAppointmentsByVehiclePlateUseCase.execute.mockResolvedValue([]);

            const result = await service.findByVehiclePlate('', 'shop-1');

            expect(mockFindAppointmentsByVehiclePlateUseCase.execute).toHaveBeenCalledWith('', 'shop-1');
            expect(result).toEqual([]);
        });

        it('should handle empty string shopId in findPublicByShopAndDate', async () => {
            mockFindPublicAppointmentsByDateUseCase.execute.mockResolvedValue([]);

            await service.findPublicByShopAndDate('', '2026-04-01');

            expect(mockFindPublicAppointmentsByDateUseCase.execute).toHaveBeenCalledWith('', new Date('2026-04-01'));
        });

        it('should pass all filters through without modification in findAll', async () => {
            mockFindAllAppointmentUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            const complexFilters = {
                shopId: 'shop-1',
                userId: 'user-1',
                status: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                page: 3,
                perPage: 50,
                sortOrder: 'desc' as const,
            };

            await service.findAll(complexFilters, regularUser);

            expect(mockFindAllAppointmentUseCase.execute).toHaveBeenCalledWith(complexFilters, regularUser);
        });
    });
});
