import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from '../appointment.controller';
import { AppointmentService } from '../appointment.service';
import { AuthService } from 'src/modules/auth/auth.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { AppointmentStatus } from '../types/AppointmentStatus';
import { SubscriptionGuard } from 'src/guards/subscription.guard';

// ── Mocks ──────────────────────────────────────────────────────────
const mockAppointmentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    createWalkIn: jest.fn(),
    findByVehiclePlate: jest.fn(),
    findPublicByShopAndDate: jest.fn(),
    findPublicAvailability: jest.fn(),
    confirmByTracking: jest.fn(),
    cancelByTracking: jest.fn(),
};

const mockAuthService = {
    buildTrackingUrl: jest.fn(),
};

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
    ],
};

const mockWalkInDto = {
    shopId: 'shop-1',
    user: { firstName: 'John', phone: '+5511999990002' },
    vehicle: { brand: 'Toyota', model: 'Corolla' },
    serviceIds: ['svc-1'],
};

describe('AppointmentController', () => {
    let controller: AppointmentController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppointmentController],
            providers: [
                { provide: AppointmentService, useValue: mockAppointmentService },
                { provide: AuthService, useValue: mockAuthService },
            ],
        })
            .overrideGuard(SubscriptionGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AppointmentController>(AppointmentController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // -----------------------------------------------------------
    // POST /appointments
    // -----------------------------------------------------------
    describe('create', () => {
        it('should delegate to appointmentService.create and append trackingUrl', async () => {
            mockAppointmentService.create.mockResolvedValue(mockAppointment);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/appt-1');

            const result = await controller.create(mockCreateDto as any, regularUser);

            expect(mockAppointmentService.create).toHaveBeenCalledWith(mockCreateDto, regularUser);
            expect(mockAuthService.buildTrackingUrl).toHaveBeenCalledWith('appt-1');
            expect(result).toEqual({
                ...mockAppointment,
                trackingUrl: 'https://track.example.com/appt-1',
            });
        });

        it('should allow creation without user (public/guest booking)', async () => {
            mockAppointmentService.create.mockResolvedValue(mockAppointment);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/appt-1');

            const result = await controller.create(mockCreateDto as any, undefined);

            expect(mockAppointmentService.create).toHaveBeenCalledWith(mockCreateDto, undefined);
            expect(result.trackingUrl).toBe('https://track.example.com/appt-1');
        });

        it('should propagate errors from appointmentService.create', async () => {
            mockAppointmentService.create.mockRejectedValue(new Error('Conflict'));

            await expect(controller.create(mockCreateDto as any, regularUser)).rejects.toThrow('Conflict');
        });

        it('should use appointment id from result for tracking URL', async () => {
            const appt = { ...mockAppointment, id: 'custom-id-123' };
            mockAppointmentService.create.mockResolvedValue(appt);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/custom-id-123');

            await controller.create(mockCreateDto as any, regularUser);

            expect(mockAuthService.buildTrackingUrl).toHaveBeenCalledWith('custom-id-123');
        });
    });

    // -----------------------------------------------------------
    // POST /appointments/walk-in
    // -----------------------------------------------------------
    describe('createWalkIn', () => {
        it('should delegate to appointmentService.createWalkIn and append trackingUrl', async () => {
            const walkInAppt = { ...mockAppointment, id: 'walkin-1' };
            mockAppointmentService.createWalkIn.mockResolvedValue(walkInAppt);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/walkin-1');

            const result = await controller.createWalkIn(mockWalkInDto as any);

            expect(mockAppointmentService.createWalkIn).toHaveBeenCalledWith(mockWalkInDto);
            expect(mockAuthService.buildTrackingUrl).toHaveBeenCalledWith('walkin-1');
            expect(result).toEqual({
                ...walkInAppt,
                trackingUrl: 'https://track.example.com/walkin-1',
            });
        });

        it('should propagate errors from appointmentService.createWalkIn', async () => {
            mockAppointmentService.createWalkIn.mockRejectedValue(new Error('Shop not active'));

            await expect(controller.createWalkIn(mockWalkInDto as any)).rejects.toThrow('Shop not active');
        });
    });

    // -----------------------------------------------------------
    // GET /appointments
    // -----------------------------------------------------------
    describe('findAll', () => {
        const mockPaginatedResult = {
            data: [mockAppointment],
            meta: { total: 1, page: 1, perPage: 10 },
        };

        it('should pass parsed query params to appointmentService.findAll', async () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            const result = await controller.findAll(regularUser, 'shop-1', 'user-1', 'PENDING', '2026-04-01', '2026-04-30', '1', '10', 'asc');

            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(
                {
                    shopId: 'shop-1',
                    userId: 'user-1',
                    status: 'PENDING',
                    startDate: '2026-04-01',
                    endDate: '2026-04-30',
                    page: 1,
                    perPage: 10,
                    sortOrder: 'asc',
                },
                regularUser,
            );
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should handle undefined query params', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser);

            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(
                {
                    shopId: undefined,
                    userId: undefined,
                    status: undefined,
                    startDate: undefined,
                    endDate: undefined,
                    page: undefined,
                    perPage: undefined,
                    sortOrder: undefined,
                },
                regularUser,
            );
        });

        it('should parse comma-separated status string', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, 'PENDING,CONFIRMED');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.status).toEqual(['PENDING', 'CONFIRMED']);
        });

        it('should handle array of status values', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, ['PENDING', 'CONFIRMED']);

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.status).toEqual(['PENDING', 'CONFIRMED']);
        });

        it('should handle single status value (no comma)', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, 'PENDING');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.status).toBe('PENDING');
        });

        it('should parse page and perPage as integers', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, undefined, undefined, undefined, '3', '25');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBe(3);
            expect(callArgs.perPage).toBe(25);
        });

        it('should set sortOrder to "desc" when string is "desc"', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'desc');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.sortOrder).toBe('desc');
        });

        it('should set sortOrder to "asc" when string is "asc"', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'asc');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.sortOrder).toBe('asc');
        });

        it('should set sortOrder to undefined for invalid sort values', () => {
            mockAppointmentService.findAll.mockResolvedValue(mockPaginatedResult);

            controller.findAll(regularUser, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'invalid');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.sortOrder).toBeUndefined();
        });
    });

    // -----------------------------------------------------------
    // GET /appointments/vehicle-plate/:plate
    // -----------------------------------------------------------
    describe('findByVehiclePlate', () => {
        it('should delegate to appointmentService.findByVehiclePlate', () => {
            mockAppointmentService.findByVehiclePlate.mockResolvedValue([mockAppointment]);

            controller.findByVehiclePlate('ABC1D23', 'shop-1');

            expect(mockAppointmentService.findByVehiclePlate).toHaveBeenCalledWith('ABC1D23', 'shop-1');
        });

        it('should propagate errors', async () => {
            mockAppointmentService.findByVehiclePlate.mockRejectedValue(new Error('Not found'));

            await expect(controller.findByVehiclePlate('XYZ', 'shop-1')).rejects.toThrow('Not found');
        });
    });

    // -----------------------------------------------------------
    // GET /appointments/public/by-date
    // -----------------------------------------------------------
    describe('findPublicByShopAndDate', () => {
        it('should delegate to appointmentService.findPublicByShopAndDate', () => {
            mockAppointmentService.findPublicByShopAndDate.mockResolvedValue([]);

            controller.findPublicByShopAndDate('shop-1', '2026-04-01');

            expect(mockAppointmentService.findPublicByShopAndDate).toHaveBeenCalledWith('shop-1', '2026-04-01');
        });

        it('should propagate errors', async () => {
            mockAppointmentService.findPublicByShopAndDate.mockRejectedValue(new Error('Service unavailable'));

            await expect(controller.findPublicByShopAndDate('shop-1', '2026-04-01')).rejects.toThrow('Service unavailable');
        });
    });

    // -----------------------------------------------------------
    // GET /appointments/public/availability
    // -----------------------------------------------------------
    describe('findPublicAvailability', () => {
        it('should parse comma-separated serviceIds and delegate to service', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1,svc-2,svc-3');

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                ['svc-1', 'svc-2', 'svc-3'],
            );
        });

        it('should handle single serviceId without comma', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1');

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                ['svc-1'],
            );
        });

        it('should handle empty serviceIds string', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', '');

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                [],
            );
        });

        it('should trim whitespace from serviceIds', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1 , svc-2 , svc-3');

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                ['svc-1', 'svc-2', 'svc-3'],
            );
        });

        it('should filter out empty strings from serviceIds', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1,,svc-2,');

            const callArgs = mockAppointmentService.findPublicAvailability.mock.calls[0];
            expect(callArgs[2]).not.toContain('');
        });

        it('should propagate errors', async () => {
            mockAppointmentService.findPublicAvailability.mockRejectedValue(new Error('Service unavailable'));

            await expect(
                controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1'),
            ).rejects.toThrow('Service unavailable');
        });
    });

    // -----------------------------------------------------------
    // PATCH /appointments/track/confirm
    // -----------------------------------------------------------
    describe('confirmByTracking', () => {
        it('should delegate to appointmentService.confirmByTracking with token', () => {
            const confirmed = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
            mockAppointmentService.confirmByTracking.mockResolvedValue(confirmed);

            controller.confirmByTracking('valid-token');

            expect(mockAppointmentService.confirmByTracking).toHaveBeenCalledWith('valid-token');
        });

        it('should propagate errors for invalid tokens', async () => {
            mockAppointmentService.confirmByTracking.mockRejectedValue(new Error('Invalid token'));

            await expect(controller.confirmByTracking('invalid')).rejects.toThrow('Invalid token');
        });
    });

    // -----------------------------------------------------------
    // PATCH /appointments/track/cancel
    // -----------------------------------------------------------
    describe('cancelByTracking', () => {
        it('should delegate to appointmentService.cancelByTracking with token and reason', () => {
            mockAppointmentService.cancelByTracking.mockResolvedValue(mockAppointment);

            controller.cancelByTracking('valid-token', 'Changed plans');

            expect(mockAppointmentService.cancelByTracking).toHaveBeenCalledWith('valid-token', 'Changed plans');
        });

        it('should work without a reason', () => {
            mockAppointmentService.cancelByTracking.mockResolvedValue(mockAppointment);

            controller.cancelByTracking('valid-token', undefined);

            expect(mockAppointmentService.cancelByTracking).toHaveBeenCalledWith('valid-token', undefined);
        });

        it('should propagate errors', async () => {
            mockAppointmentService.cancelByTracking.mockRejectedValue(new Error('Bad token'));

            await expect(controller.cancelByTracking('bad-token')).rejects.toThrow('Bad token');
        });
    });

    // -----------------------------------------------------------
    // GET /appointments/:id
    // -----------------------------------------------------------
    describe('findOne', () => {
        it('should delegate to appointmentService.findOne with id and user', () => {
            mockAppointmentService.findOne.mockResolvedValue(mockAppointment);

            controller.findOne('appt-1', regularUser);

            expect(mockAppointmentService.findOne).toHaveBeenCalledWith('appt-1', regularUser);
        });

        it('should propagate errors when appointment not found', async () => {
            mockAppointmentService.findOne.mockRejectedValue(new Error('Appointment not found'));

            await expect(controller.findOne('nonexistent', regularUser)).rejects.toThrow('Appointment not found');
        });
    });

    // -----------------------------------------------------------
    // PATCH /appointments/:id
    // -----------------------------------------------------------
    describe('update', () => {
        it('should delegate to appointmentService.update with id, data, and user', () => {
            const updateDto = { status: AppointmentStatus.CONFIRMED };
            mockAppointmentService.update.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CONFIRMED });

            controller.update('appt-1', updateDto as any, regularUser);

            expect(mockAppointmentService.update).toHaveBeenCalledWith('appt-1', updateDto, regularUser);
        });

        it('should propagate errors from appointmentService.update', async () => {
            mockAppointmentService.update.mockRejectedValue(new Error('Invalid transition'));

            await expect(
                controller.update('appt-1', { status: AppointmentStatus.COMPLETED } as any, regularUser),
            ).rejects.toThrow('Invalid transition');
        });
    });

    // -----------------------------------------------------------
    // DELETE /appointments/:id
    // -----------------------------------------------------------
    describe('cancel', () => {
        it('should delegate to appointmentService.cancel with id, user, and reason', () => {
            mockAppointmentService.cancel.mockResolvedValue({ message: 'Canceled', appointment: mockAppointment });

            controller.cancel('appt-1', regularUser, 'No longer needed');

            expect(mockAppointmentService.cancel).toHaveBeenCalledWith('appt-1', regularUser, 'No longer needed');
        });

        it('should work without a reason', () => {
            mockAppointmentService.cancel.mockResolvedValue({ message: 'Canceled', appointment: mockAppointment });

            controller.cancel('appt-1', regularUser, undefined);

            expect(mockAppointmentService.cancel).toHaveBeenCalledWith('appt-1', regularUser, undefined);
        });

        it('should propagate errors from appointmentService.cancel', async () => {
            mockAppointmentService.cancel.mockRejectedValue(new Error('Cannot cancel'));

            await expect(controller.cancel('appt-1', regularUser)).rejects.toThrow('Cannot cancel');
        });
    });

    // -----------------------------------------------------------
    // Security: IDOR (Insecure Direct Object Reference)
    // -----------------------------------------------------------
    describe('Security: IDOR', () => {
        it('should always pass user context to findOne for ownership scoping', () => {
            mockAppointmentService.findOne.mockResolvedValue(mockAppointment);

            controller.findOne('appt-1', otherUser);

            expect(mockAppointmentService.findOne).toHaveBeenCalledWith('appt-1', otherUser);
        });

        it('should always pass user context to update for ownership scoping', () => {
            mockAppointmentService.update.mockResolvedValue(mockAppointment);

            controller.update('appt-1', { notes: 'hacked' } as any, otherUser);

            expect(mockAppointmentService.update).toHaveBeenCalledWith('appt-1', { notes: 'hacked' }, otherUser);
        });

        it('should always pass user context to cancel for ownership scoping', () => {
            mockAppointmentService.cancel.mockResolvedValue({ message: 'ok', appointment: mockAppointment });

            controller.cancel('appt-1', otherUser);

            expect(mockAppointmentService.cancel).toHaveBeenCalledWith('appt-1', otherUser, undefined);
        });

        it('should always pass user context to findAll for row-level filtering', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(otherUser, 'shop-1', 'user-1');

            // The user context (user-2) is passed, even though the query asks for user-1 data
            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ shopId: 'shop-1', userId: 'user-1' }),
                otherUser,
            );
        });
    });

    // -----------------------------------------------------------
    // Security: Authorization bypass tests
    // -----------------------------------------------------------
    describe('Security: Authorization context', () => {
        it('should pass ADMIN user to service methods', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            controller.findAll(adminUser, 'shop-1');
            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(expect.anything(), adminUser);
        });

        it('should pass OWNER user to service methods', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            controller.findAll(ownerUser, 'shop-1');
            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(expect.anything(), ownerUser);
        });

        it('should pass EMPLOYEE user to service methods', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            controller.findAll(employeeUser, 'shop-1');
            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(expect.anything(), employeeUser);
        });

        it('should pass USER role to service methods', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
            controller.findAll(regularUser, 'shop-1');
            expect(mockAppointmentService.findAll).toHaveBeenCalledWith(expect.anything(), regularUser);
        });
    });

    // -----------------------------------------------------------
    // Security: Input validation / injection via plate
    // -----------------------------------------------------------
    describe('Security: Input validation', () => {
        it('should pass plate with XSS payload to service (DTO validation should catch)', () => {
            mockAppointmentService.findByVehiclePlate.mockResolvedValue([]);

            controller.findByVehiclePlate('<script>alert("xss")</script>', 'shop-1');

            expect(mockAppointmentService.findByVehiclePlate).toHaveBeenCalledWith(
                '<script>alert("xss")</script>',
                'shop-1',
            );
        });

        it('should pass plate with SQL injection payload to service (parameterized queries should protect)', () => {
            mockAppointmentService.findByVehiclePlate.mockResolvedValue([]);

            controller.findByVehiclePlate("'; DROP TABLE appointments; --", 'shop-1');

            expect(mockAppointmentService.findByVehiclePlate).toHaveBeenCalledWith(
                "'; DROP TABLE appointments; --",
                'shop-1',
            );
        });

        it('should pass extremely long strings to service (should be validated upstream)', () => {
            mockAppointmentService.findByVehiclePlate.mockResolvedValue([]);
            const longPlate = 'A'.repeat(10000);

            controller.findByVehiclePlate(longPlate, 'shop-1');

            expect(mockAppointmentService.findByVehiclePlate).toHaveBeenCalledWith(longPlate, 'shop-1');
        });

        it('should not sanitize serviceIds - passes raw input to service', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            controller.findPublicAvailability('shop-1', '2026-04-01', "svc-1'; DROP TABLE--");

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                ["svc-1'; DROP TABLE--"],
            );
        });
    });

    // -----------------------------------------------------------
    // Security: Status manipulation tests
    // -----------------------------------------------------------
    describe('Security: Status manipulation', () => {
        it('should forward any status value to service (DTO enum validation is the guard)', () => {
            mockAppointmentService.update.mockResolvedValue(mockAppointment);

            controller.update('appt-1', { status: 'INVALID_STATUS' } as any, regularUser);

            expect(mockAppointmentService.update).toHaveBeenCalledWith(
                'appt-1',
                { status: 'INVALID_STATUS' },
                regularUser,
            );
        });

        it('should forward COMPLETED status to service (use case validates transitions)', () => {
            mockAppointmentService.update.mockResolvedValue(mockAppointment);

            controller.update('appt-1', { status: AppointmentStatus.COMPLETED } as any, regularUser);

            expect(mockAppointmentService.update).toHaveBeenCalledWith(
                'appt-1',
                { status: AppointmentStatus.COMPLETED },
                regularUser,
            );
        });
    });

    // -----------------------------------------------------------
    // Security: Public endpoints
    // -----------------------------------------------------------
    describe('Security: Public endpoints', () => {
        it('create endpoint allows optional user (public access)', async () => {
            mockAppointmentService.create.mockResolvedValue(mockAppointment);
            mockAuthService.buildTrackingUrl.mockReturnValue('url');

            const result = await controller.create(mockCreateDto as any, undefined);

            expect(mockAppointmentService.create).toHaveBeenCalledWith(mockCreateDto, undefined);
            expect(result).toBeDefined();
        });

        it('findPublicByShopAndDate does not require user context', () => {
            mockAppointmentService.findPublicByShopAndDate.mockResolvedValue([]);

            // No user parameter required for this public endpoint
            const result = controller.findPublicByShopAndDate('shop-1', '2026-04-01');

            expect(mockAppointmentService.findPublicByShopAndDate).toHaveBeenCalledWith('shop-1', '2026-04-01');
        });

        it('findPublicAvailability does not require user context', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            const result = controller.findPublicAvailability('shop-1', '2026-04-01', 'svc-1');

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalled();
        });

        it('confirmByTracking does not require user context', () => {
            mockAppointmentService.confirmByTracking.mockResolvedValue(mockAppointment);

            controller.confirmByTracking('token');

            expect(mockAppointmentService.confirmByTracking).toHaveBeenCalledWith('token');
        });

        it('cancelByTracking does not require user context', () => {
            mockAppointmentService.cancelByTracking.mockResolvedValue(mockAppointment);

            controller.cancelByTracking('token', 'reason');

            expect(mockAppointmentService.cancelByTracking).toHaveBeenCalledWith('token', 'reason');
        });
    });

    // -----------------------------------------------------------
    // Security: Data leakage - trackingUrl
    // -----------------------------------------------------------
    describe('Security: Data leakage via trackingUrl', () => {
        it('should include trackingUrl in create response', async () => {
            mockAppointmentService.create.mockResolvedValue(mockAppointment);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/appt-1');

            const result = await controller.create(mockCreateDto as any, regularUser);

            expect(result.trackingUrl).toBe('https://track.example.com/appt-1');
        });

        it('should include trackingUrl in createWalkIn response', async () => {
            const walkInAppt = { ...mockAppointment, id: 'walkin-1' };
            mockAppointmentService.createWalkIn.mockResolvedValue(walkInAppt);
            mockAuthService.buildTrackingUrl.mockReturnValue('https://track.example.com/walkin-1');

            const result = await controller.createWalkIn(mockWalkInDto as any);

            expect(result.trackingUrl).toBe('https://track.example.com/walkin-1');
        });

        it('findOne does not add trackingUrl to response', async () => {
            mockAppointmentService.findOne.mockResolvedValue(mockAppointment);

            const result = await controller.findOne('appt-1', regularUser);

            expect(result).not.toHaveProperty('trackingUrl');
            expect(mockAuthService.buildTrackingUrl).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------
    // Security: Race conditions (documentation)
    // -----------------------------------------------------------
    describe('Security: Race conditions', () => {
        it('should handle concurrent create calls (both resolve independently at controller level)', async () => {
            mockAppointmentService.create.mockResolvedValue(mockAppointment);
            mockAuthService.buildTrackingUrl.mockReturnValue('url');

            // Simulate two concurrent creates - at the controller level both will succeed
            // The use case level uses serializable transactions to prevent double-booking
            const [result1, result2] = await Promise.all([
                controller.create(mockCreateDto as any, regularUser),
                controller.create(mockCreateDto as any, regularUser),
            ]);

            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
            expect(mockAppointmentService.create).toHaveBeenCalledTimes(2);
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('findAll should handle NaN page gracefully (parseInt returns NaN)', () => {
            mockAppointmentService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

            controller.findAll(regularUser, undefined, undefined, undefined, undefined, undefined, 'abc', 'xyz');

            const callArgs = mockAppointmentService.findAll.mock.calls[0][0];
            expect(callArgs.page).toBeNaN();
            expect(callArgs.perPage).toBeNaN();
        });

        it('should spread appointment properties and add trackingUrl in create response', async () => {
            const apptWithExtraFields = {
                ...mockAppointment,
                customField: 'extra',
            };
            mockAppointmentService.create.mockResolvedValue(apptWithExtraFields);
            mockAuthService.buildTrackingUrl.mockReturnValue('url');

            const result = await controller.create(mockCreateDto as any, regularUser);

            expect((result as any).customField).toBe('extra');
            expect(result.trackingUrl).toBe('url');
        });

        it('findPublicAvailability should handle undefined/null serviceIds gracefully', () => {
            mockAppointmentService.findPublicAvailability.mockResolvedValue({ availableSlots: [] });

            // When serviceIds is undefined/falsy, should pass empty array
            controller.findPublicAvailability('shop-1', '2026-04-01', undefined as any);

            expect(mockAppointmentService.findPublicAvailability).toHaveBeenCalledWith(
                'shop-1',
                '2026-04-01',
                [],
            );
        });
    });
});
