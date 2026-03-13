import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from '../vehicle.controller';
import { VehicleService } from '../vehicle.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockVehicleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPlate: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleVehicle = {
    id: 'v1',
    plate: 'ABC1D23',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    color: 'Black',
    size: 'MEDIUM',
    type: 'CAR',
    isActive: true,
    userId: 'user-1',
};

describe('VehicleController', () => {
    let controller: VehicleController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [VehicleController],
            providers: [
                { provide: VehicleService, useValue: mockVehicleService },
            ],
        }).compile();

        controller = module.get<VehicleController>(VehicleController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // =======================================================================
    // POST /vehicle  (create)
    // =======================================================================
    describe('create', () => {
        const createDto: CreateVehicleDto = {
            plate: 'ABC1D23',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2023,
            color: 'Black',
            size: 'MEDIUM' as any,
            type: 'CAR' as any,
            isActive: true,
            userId: 'user-1',
        };

        it('should delegate to vehicleService.create with dto', async () => {
            const created = { id: 'v1', ...createDto };
            mockVehicleService.create.mockResolvedValue(created);

            const result = await controller.create(createDto);

            expect(mockVehicleService.create).toHaveBeenCalledWith(createDto);
            expect(mockVehicleService.create).toHaveBeenCalledTimes(1);
            expect(result).toEqual(created);
        });

        it('should propagate errors from vehicleService.create', async () => {
            mockVehicleService.create.mockRejectedValue(new Error('DB error'));

            await expect(controller.create(createDto)).rejects.toThrow('DB error');
        });

        it('should forward complete DTO including all optional fields', async () => {
            mockVehicleService.create.mockResolvedValue({ id: 'v2', ...createDto });

            await controller.create(createDto);

            expect(mockVehicleService.create).toHaveBeenCalledWith(createDto);
        });

        it('should handle vehicle creation without optional plate', async () => {
            const noPlateDto: CreateVehicleDto = {
                brand: 'Fiat',
                model: 'Uno',
                userId: 'user-1',
            };
            mockVehicleService.create.mockResolvedValue({ id: 'v3', ...noPlateDto, plate: null });

            const result = await controller.create(noPlateDto);

            expect(mockVehicleService.create).toHaveBeenCalledWith(noPlateDto);
            expect(result.plate).toBeNull();
        });

        it('should handle minimal DTO (only required fields)', async () => {
            const minimalDto: CreateVehicleDto = {
                brand: 'Honda',
                model: 'Civic',
                userId: 'user-1',
            };
            mockVehicleService.create.mockResolvedValue({ id: 'v4', ...minimalDto });

            const result = await controller.create(minimalDto);

            expect(result.id).toBe('v4');
        });
    });

    // =======================================================================
    // GET /vehicle  (findAll)
    // =======================================================================
    describe('findAll', () => {
        it('should pass parsed query params to vehicleService.findAll', async () => {
            mockVehicleService.findAll.mockResolvedValue({ data: [sampleVehicle], meta: { total: 1 } });

            const result = await controller.findAll('user-1', '1', '10');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                userId: 'user-1',
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual({ data: [sampleVehicle], meta: { total: 1 } });
        });

        it('should pass undefined for missing query params', async () => {
            mockVehicleService.findAll.mockResolvedValue([]);

            await controller.findAll(undefined, undefined, undefined);

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                userId: undefined,
                page: undefined,
                perPage: undefined,
            });
        });

        it('should correctly parse integer strings for pagination', async () => {
            mockVehicleService.findAll.mockResolvedValue([]);

            await controller.findAll(undefined, '3', '25');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                userId: undefined,
                page: 3,
                perPage: 25,
            });
        });

        it('should result in NaN for non-numeric page strings', async () => {
            mockVehicleService.findAll.mockResolvedValue([]);

            await controller.findAll(undefined, 'abc', 'xyz');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                userId: undefined,
                page: NaN,
                perPage: NaN,
            });
        });

        it('should pass only userId without pagination', async () => {
            mockVehicleService.findAll.mockResolvedValue([sampleVehicle]);

            await controller.findAll('user-1', undefined, undefined);

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                userId: 'user-1',
                page: undefined,
                perPage: undefined,
            });
        });

        it('should propagate errors from vehicleService.findAll', async () => {
            mockVehicleService.findAll.mockRejectedValue(new Error('DB error'));

            await expect(controller.findAll()).rejects.toThrow('DB error');
        });
    });

    // =======================================================================
    // GET /vehicle/plate/:plate  (findByPlate)
    // =======================================================================
    describe('findByPlate', () => {
        it('should delegate to vehicleService.findByPlate', async () => {
            mockVehicleService.findByPlate.mockResolvedValue(sampleVehicle);

            const result = await controller.findByPlate('ABC1D23');

            expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('ABC1D23');
            expect(result).toEqual(sampleVehicle);
        });

        it('should propagate errors when plate not found', async () => {
            mockVehicleService.findByPlate.mockRejectedValue(new Error('Vehicle not found!'));

            await expect(controller.findByPlate('XYZ0000')).rejects.toThrow('Vehicle not found!');
        });

        it('should return null if service returns null', async () => {
            mockVehicleService.findByPlate.mockResolvedValue(null);

            const result = await controller.findByPlate('AAA0000');

            expect(result).toBeNull();
        });
    });

    // =======================================================================
    // GET /vehicle/:id  (findOne)
    // =======================================================================
    describe('findOne', () => {
        it('should delegate to vehicleService.findOne', async () => {
            mockVehicleService.findOne.mockResolvedValue(sampleVehicle);

            const result = await controller.findOne('v1');

            expect(mockVehicleService.findOne).toHaveBeenCalledWith('v1');
            expect(result).toEqual(sampleVehicle);
        });

        it('should propagate not-found errors', async () => {
            mockVehicleService.findOne.mockRejectedValue(new Error('Vehicle not found!'));

            await expect(controller.findOne('nonexistent')).rejects.toThrow('Vehicle not found!');
        });
    });

    // =======================================================================
    // PATCH /vehicle/:id  (update)
    // =======================================================================
    describe('update', () => {
        it('should delegate to vehicleService.update', async () => {
            const updateDto: UpdateVehicleDto = { color: 'Red' };
            const updated = { ...sampleVehicle, color: 'Red' };
            mockVehicleService.update.mockResolvedValue(updated);

            const result = await controller.update('v1', updateDto);

            expect(mockVehicleService.update).toHaveBeenCalledWith('v1', updateDto);
            expect(result).toEqual(updated);
        });

        it('should handle partial update with multiple fields', async () => {
            const updateDto: UpdateVehicleDto = { brand: 'Honda', model: 'Fit', year: 2024 };
            mockVehicleService.update.mockResolvedValue({ ...sampleVehicle, ...updateDto });

            await controller.update('v1', updateDto);

            expect(mockVehicleService.update).toHaveBeenCalledWith('v1', updateDto);
        });

        it('should propagate errors from vehicleService.update', async () => {
            mockVehicleService.update.mockRejectedValue(new Error('Vehicle not found!'));

            await expect(controller.update('v1', {} as UpdateVehicleDto)).rejects.toThrow('Vehicle not found!');
        });

        it('should handle empty update DTO', async () => {
            const emptyDto: UpdateVehicleDto = {};
            mockVehicleService.update.mockResolvedValue(sampleVehicle);

            await controller.update('v1', emptyDto);

            expect(mockVehicleService.update).toHaveBeenCalledWith('v1', {});
        });
    });

    // =======================================================================
    // DELETE /vehicle/:id  (remove)
    // =======================================================================
    describe('remove', () => {
        it('should delegate to vehicleService.remove', async () => {
            mockVehicleService.remove.mockResolvedValue({ deleted: true });

            const result = await controller.remove('v1');

            expect(mockVehicleService.remove).toHaveBeenCalledWith('v1');
            expect(result).toEqual({ deleted: true });
        });

        it('should propagate errors from vehicleService.remove', async () => {
            mockVehicleService.remove.mockRejectedValue(new Error('Vehicle not found!'));

            await expect(controller.remove('nonexistent')).rejects.toThrow('Vehicle not found!');
        });
    });

    // =======================================================================
    // Security Tests
    // =======================================================================
    describe('Security', () => {
        // -----------------------------------------------------------
        // IDOR - accessing other users vehicles
        // -----------------------------------------------------------
        describe('IDOR - no user context enforcement at controller level', () => {
            it('findOne passes raw id to service without ownership check', async () => {
                mockVehicleService.findOne.mockResolvedValue(sampleVehicle);

                await controller.findOne('v1');

                expect(mockVehicleService.findOne).toHaveBeenCalledWith('v1');
            });

            it('update passes raw id to service without ownership check', async () => {
                mockVehicleService.update.mockResolvedValue(sampleVehicle);

                await controller.update('v1', { color: 'Red' });

                expect(mockVehicleService.update).toHaveBeenCalledWith('v1', { color: 'Red' });
            });

            it('remove passes raw id to service without ownership check', async () => {
                mockVehicleService.remove.mockResolvedValue({ deleted: true });

                await controller.remove('v1');

                expect(mockVehicleService.remove).toHaveBeenCalledWith('v1');
            });

            it('findAll allows querying any userId without validation', async () => {
                mockVehicleService.findAll.mockResolvedValue([]);

                await controller.findAll('another-users-id', '1', '10');

                expect(mockVehicleService.findAll).toHaveBeenCalledWith({
                    userId: 'another-users-id',
                    page: 1,
                    perPage: 10,
                });
            });

            it('create allows setting any userId in dto without validation', async () => {
                const dto: CreateVehicleDto = {
                    brand: 'Toyota',
                    model: 'Corolla',
                    userId: 'victim-user-id',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-new', ...dto });

                await controller.create(dto);

                expect(mockVehicleService.create.mock.calls[0][0].userId).toBe('victim-user-id');
            });
        });

        // -----------------------------------------------------------
        // Vehicle plate injection
        // -----------------------------------------------------------
        describe('Vehicle plate injection', () => {
            it('should pass SQL injection in plate to service', async () => {
                mockVehicleService.findByPlate.mockRejectedValue(new Error('Not found'));

                await expect(controller.findByPlate("'; DROP TABLE vehicles; --")).rejects.toThrow('Not found');
                expect(mockVehicleService.findByPlate).toHaveBeenCalledWith("'; DROP TABLE vehicles; --");
            });

            it('should pass path-traversal plate to service', async () => {
                mockVehicleService.findByPlate.mockRejectedValue(new Error('Not found'));

                await expect(controller.findByPlate('../../../etc/passwd')).rejects.toThrow('Not found');
                expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('../../../etc/passwd');
            });

            it('should pass URL-encoded plate to service', async () => {
                mockVehicleService.findByPlate.mockRejectedValue(new Error('Not found'));

                await expect(controller.findByPlate('%00%0d%0a')).rejects.toThrow('Not found');
                expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('%00%0d%0a');
            });

            it('should pass XSS in plate to service via create', async () => {
                const xssDto: CreateVehicleDto = {
                    plate: '<script>alert(1)</script>' as any,
                    brand: 'Toyota',
                    model: 'Corolla',
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-x' });

                await controller.create(xssDto);

                expect(mockVehicleService.create.mock.calls[0][0].plate).toBe('<script>alert(1)</script>');
            });
        });

        // -----------------------------------------------------------
        // Input validation - XSS in model/brand names
        // -----------------------------------------------------------
        describe('XSS in model/brand fields', () => {
            it('should forward XSS in brand to service (DTO validation layer responsibility)', async () => {
                const xssDto: CreateVehicleDto = {
                    brand: '<img src=x onerror=alert(document.cookie)>',
                    model: 'Corolla',
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-xss' });

                await controller.create(xssDto);

                expect(mockVehicleService.create.mock.calls[0][0].brand).toBe('<img src=x onerror=alert(document.cookie)>');
            });

            it('should forward XSS in model to service', async () => {
                const xssDto: CreateVehicleDto = {
                    brand: 'Toyota',
                    model: '<svg/onload=alert(1)>',
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-xss2' });

                await controller.create(xssDto);

                expect(mockVehicleService.create.mock.calls[0][0].model).toBe('<svg/onload=alert(1)>');
            });

            it('should forward XSS in color to service via update', async () => {
                const dto: UpdateVehicleDto = { color: '"><script>alert(1)</script>' };
                mockVehicleService.update.mockResolvedValue({ id: 'v1' });

                await controller.update('v1', dto);

                expect(mockVehicleService.update.mock.calls[0][1].color).toBe('"><script>alert(1)</script>');
            });

            it('should forward SQL injection in brand to service via create', async () => {
                const sqlDto: CreateVehicleDto = {
                    brand: "Robert'; DROP TABLE vehicles;--",
                    model: 'Corolla',
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-sql' });

                await controller.create(sqlDto);

                expect(mockVehicleService.create.mock.calls[0][0].brand).toBe("Robert'; DROP TABLE vehicles;--");
            });

            it('should forward SQL injection in model to service via update', async () => {
                const dto: UpdateVehicleDto = { model: "'; DROP TABLE vehicles; --" };
                mockVehicleService.update.mockResolvedValue({ id: 'v1' });

                await controller.update('v1', dto);

                expect(mockVehicleService.update.mock.calls[0][1].model).toBe("'; DROP TABLE vehicles; --");
            });
        });

        // -----------------------------------------------------------
        // VehicleType/VehicleSize enum validation
        // -----------------------------------------------------------
        describe('VehicleType/VehicleSize enum validation', () => {
            it('should forward valid VehicleType values to service', async () => {
                const vehicleTypes = ['CAR', 'MOTORCYCLE', 'TRUCK', 'SUV', 'VAN', 'OTHER'];

                for (const type of vehicleTypes) {
                    mockVehicleService.create.mockResolvedValue({ id: 'v-enum', type });

                    const dto: CreateVehicleDto = {
                        brand: 'Toyota',
                        model: 'Corolla',
                        type: type as any,
                        userId: 'user-1',
                    };

                    await controller.create(dto);

                    expect(mockVehicleService.create).toHaveBeenCalledWith(dto);
                }
            });

            it('should forward valid VehicleSize values to service', async () => {
                const vehicleSizes = ['SMALL', 'MEDIUM', 'LARGE'];

                for (const size of vehicleSizes) {
                    mockVehicleService.create.mockResolvedValue({ id: 'v-size', size });

                    const dto: CreateVehicleDto = {
                        brand: 'Toyota',
                        model: 'Corolla',
                        size: size as any,
                        userId: 'user-1',
                    };

                    await controller.create(dto);

                    expect(mockVehicleService.create).toHaveBeenCalledWith(dto);
                }
            });

            it('should forward invalid enum values to service (DTO pipe validates, not controller)', async () => {
                const invalidDto: CreateVehicleDto = {
                    brand: 'Toyota',
                    model: 'Corolla',
                    type: 'SPACESHIP' as any,
                    size: 'ENORMOUS' as any,
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v-inv' });

                await controller.create(invalidDto);

                expect(mockVehicleService.create.mock.calls[0][0].type).toBe('SPACESHIP');
                expect(mockVehicleService.create.mock.calls[0][0].size).toBe('ENORMOUS');
            });

            it('should forward enum update values to service', async () => {
                const dto: UpdateVehicleDto = { type: 'MOTORCYCLE' as any, size: 'SMALL' as any };
                mockVehicleService.update.mockResolvedValue({ ...sampleVehicle, ...dto });

                await controller.update('v1', dto);

                expect(mockVehicleService.update).toHaveBeenCalledWith('v1', dto);
            });
        });

        // -----------------------------------------------------------
        // User context forwarding
        // -----------------------------------------------------------
        describe('User context forwarding', () => {
            it('create does not receive or forward any user context', async () => {
                const dto: CreateVehicleDto = {
                    brand: 'Toyota',
                    model: 'Corolla',
                    userId: 'user-1',
                };
                mockVehicleService.create.mockResolvedValue({ id: 'v1', ...dto });

                await controller.create(dto);

                // Controller only passes DTO to service -- no user context parameter
                expect(mockVehicleService.create).toHaveBeenCalledWith(dto);
                expect(mockVehicleService.create.mock.calls[0]).toHaveLength(1);
            });

            it('findAll does not receive or forward any user context', async () => {
                mockVehicleService.findAll.mockResolvedValue([]);

                await controller.findAll('user-1', '1', '10');

                // Only the filters object is passed
                expect(mockVehicleService.findAll.mock.calls[0]).toHaveLength(1);
            });

            it('findOne does not receive or forward any user context', async () => {
                mockVehicleService.findOne.mockResolvedValue(sampleVehicle);

                await controller.findOne('v1');

                expect(mockVehicleService.findOne).toHaveBeenCalledWith('v1');
                expect(mockVehicleService.findOne.mock.calls[0]).toHaveLength(1);
            });

            it('update does not receive or forward any user context', async () => {
                mockVehicleService.update.mockResolvedValue(sampleVehicle);

                await controller.update('v1', { color: 'Red' });

                expect(mockVehicleService.update).toHaveBeenCalledWith('v1', { color: 'Red' });
                expect(mockVehicleService.update.mock.calls[0]).toHaveLength(2);
            });

            it('remove does not receive or forward any user context', async () => {
                mockVehicleService.remove.mockResolvedValue({ deleted: true });

                await controller.remove('v1');

                expect(mockVehicleService.remove).toHaveBeenCalledWith('v1');
                expect(mockVehicleService.remove.mock.calls[0]).toHaveLength(1);
            });

            it('findByPlate does not receive or forward any user context', async () => {
                mockVehicleService.findByPlate.mockResolvedValue(sampleVehicle);

                await controller.findByPlate('ABC1D23');

                expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('ABC1D23');
                expect(mockVehicleService.findByPlate.mock.calls[0]).toHaveLength(1);
            });
        });

        // -----------------------------------------------------------
        // ID parameter injection
        // -----------------------------------------------------------
        describe('ID parameter injection', () => {
            it('should pass path-traversal id to service via findOne', async () => {
                mockVehicleService.findOne.mockRejectedValue(new Error('Not found'));

                await expect(controller.findOne('../../../etc/passwd')).rejects.toThrow('Not found');
                expect(mockVehicleService.findOne).toHaveBeenCalledWith('../../../etc/passwd');
            });

            it('should pass SQL injection id to service via update', async () => {
                mockVehicleService.update.mockRejectedValue(new Error('Not found'));

                await expect(controller.update("'; DROP TABLE vehicles; --", { color: 'Red' })).rejects.toThrow('Not found');
                expect(mockVehicleService.update).toHaveBeenCalledWith("'; DROP TABLE vehicles; --", { color: 'Red' });
            });

            it('should pass SQL injection id to service via remove', async () => {
                mockVehicleService.remove.mockRejectedValue(new Error('Not found'));

                await expect(controller.remove("'; DROP TABLE vehicles; --")).rejects.toThrow('Not found');
                expect(mockVehicleService.remove).toHaveBeenCalledWith("'; DROP TABLE vehicles; --");
            });
        });
    });

    // =======================================================================
    // Edge cases
    // =======================================================================
    describe('Edge cases', () => {
        it('create should handle vehicle with all optional fields populated', async () => {
            const fullDto: CreateVehicleDto = {
                plate: 'ABC1D23',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2023,
                color: 'Black',
                size: 'MEDIUM' as any,
                type: 'CAR' as any,
                isActive: true,
                userId: 'user-1',
            };
            mockVehicleService.create.mockResolvedValue({ id: 'v-full', ...fullDto });

            const result = await controller.create(fullDto);

            expect(mockVehicleService.create).toHaveBeenCalledWith(fullDto);
            expect(result.plate).toBe('ABC1D23');
        });

        it('findAll with pagination should forward page and perPage', async () => {
            mockVehicleService.findAll.mockResolvedValue({ data: [], total: 0 });

            await controller.findAll(undefined, '2', '5');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({ userId: undefined, page: 2, perPage: 5 });
        });

        it('findAll should handle zero page', async () => {
            mockVehicleService.findAll.mockResolvedValue([]);

            await controller.findAll(undefined, '0', '10');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({ userId: undefined, page: 0, perPage: 10 });
        });

        it('findAll should handle very large page numbers', async () => {
            mockVehicleService.findAll.mockResolvedValue([]);

            await controller.findAll(undefined, '999999', '100');

            expect(mockVehicleService.findAll).toHaveBeenCalledWith({ userId: undefined, page: 999999, perPage: 100 });
        });

        it('update should not modify fields not included in DTO', async () => {
            const updateDto: UpdateVehicleDto = { color: 'Blue' };
            mockVehicleService.update.mockResolvedValue({ ...sampleVehicle, color: 'Blue' });

            const result = await controller.update('v1', updateDto);

            expect(mockVehicleService.update).toHaveBeenCalledWith('v1', { color: 'Blue' });
            expect(result.brand).toBe('Toyota');
        });

        it('findByPlate should handle lowercase plate', async () => {
            mockVehicleService.findByPlate.mockResolvedValue(null);

            await controller.findByPlate('abc1d23');

            expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('abc1d23');
        });

        it('findByPlate should handle plate with special characters', async () => {
            mockVehicleService.findByPlate.mockResolvedValue(null);

            await controller.findByPlate('ABC-1D23');

            expect(mockVehicleService.findByPlate).toHaveBeenCalledWith('ABC-1D23');
        });

        it('create should handle vehicle with year at boundary values', async () => {
            const dto1900: CreateVehicleDto = {
                brand: 'Ford',
                model: 'Model T',
                year: 1900,
                userId: 'user-1',
            };
            mockVehicleService.create.mockResolvedValue({ id: 'v-old', ...dto1900 });

            const result = await controller.create(dto1900);

            expect(result.year).toBe(1900);
        });
    });
});
