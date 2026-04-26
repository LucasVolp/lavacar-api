import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from '../vehicle.service';
import { CreateVehicleUseCase } from '../use-cases/create-vehicle.use-case';
import { FindAllVehiclesUseCase } from '../use-cases/find-all-vehicles.use-case';
import { FindVehicleByIdUseCase } from '../use-cases/find-vehicle-by-id.use-case';
import { FindVehicleByPlateUseCase } from '../use-cases/find-vehicle-by-plate.use-case';
import { UpdateVehicleUseCase } from '../use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../use-cases/delete-vehicle.use-case';

const mockCreateVehicleUseCase = { execute: jest.fn() };
const mockFindAllVehiclesUseCase = { execute: jest.fn() };
const mockFindVehicleByIdUseCase = { execute: jest.fn() };
const mockFindVehicleByPlateUseCase = { execute: jest.fn() };
const mockUpdateVehicleUseCase = { execute: jest.fn() };
const mockDeleteVehicleUseCase = { execute: jest.fn() };

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        { provide: CreateVehicleUseCase, useValue: mockCreateVehicleUseCase },
        { provide: FindAllVehiclesUseCase, useValue: mockFindAllVehiclesUseCase },
        { provide: FindVehicleByIdUseCase, useValue: mockFindVehicleByIdUseCase },
        { provide: FindVehicleByPlateUseCase, useValue: mockFindVehicleByPlateUseCase },
        { provide: UpdateVehicleUseCase, useValue: mockUpdateVehicleUseCase },
        { provide: DeleteVehicleUseCase, useValue: mockDeleteVehicleUseCase },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------
  // create
  // -----------------------------------------------------------
  describe('create', () => {
    it('should delegate to CreateVehicleUseCase', async () => {
      const dto = { brand: 'Toyota', model: 'Corolla', userId: 'u1' } as any;
      const vehicle = { id: 'v1', ...dto };
      mockCreateVehicleUseCase.execute.mockResolvedValue(vehicle);

      const result = await service.create(dto);

      expect(mockCreateVehicleUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(vehicle);
    });

    it('should propagate errors from CreateVehicleUseCase', async () => {
      mockCreateVehicleUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(service.create({} as any)).rejects.toThrow('DB error');
    });

    it('should pass all DTO fields through', async () => {
      const fullDto = {
        plate: 'ABC1D23',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        color: 'Black',
        size: 'MEDIUM',
        type: 'CAR',
        isActive: true,
        userId: 'u1',
      } as any;
      mockCreateVehicleUseCase.execute.mockResolvedValue({ id: 'v1', ...fullDto });

      await service.create(fullDto);

      expect(mockCreateVehicleUseCase.execute).toHaveBeenCalledWith(fullDto);
    });
  });

  // -----------------------------------------------------------
  // findAll
  // -----------------------------------------------------------
  describe('findAll', () => {
    it('should delegate to FindAllVehiclesUseCase with filters', async () => {
      const vehicles = [{ id: 'v1' }, { id: 'v2' }];
      mockFindAllVehiclesUseCase.execute.mockResolvedValue(vehicles);

      const filters = { userId: 'u1', page: 1, perPage: 10 };
      const result = await service.findAll(filters);

      expect(mockFindAllVehiclesUseCase.execute).toHaveBeenCalledWith(filters);
      expect(result).toEqual(vehicles);
    });

    it('should work without filters', async () => {
      mockFindAllVehiclesUseCase.execute.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockFindAllVehiclesUseCase.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should propagate errors from FindAllVehiclesUseCase', async () => {
      mockFindAllVehiclesUseCase.execute.mockRejectedValue(new Error('fail'));

      await expect(service.findAll()).rejects.toThrow('fail');
    });
  });

  // -----------------------------------------------------------
  // findOne
  // -----------------------------------------------------------
  describe('findOne', () => {
    it('should delegate to FindVehicleByIdUseCase', async () => {
      const vehicle = { id: 'v1', brand: 'Toyota', model: 'Corolla' };
      mockFindVehicleByIdUseCase.execute.mockResolvedValue(vehicle);

      const result = await service.findOne('v1');

      expect(mockFindVehicleByIdUseCase.execute).toHaveBeenCalledWith('v1');
      expect(result).toEqual(vehicle);
    });

    it('should propagate errors when vehicle not found', async () => {
      mockFindVehicleByIdUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(service.findOne('missing')).rejects.toThrow('Not found');
    });
  });

  // -----------------------------------------------------------
  // findByPlate
  // -----------------------------------------------------------
  describe('findByPlate', () => {
    it('should delegate to FindVehicleByPlateUseCase', async () => {
      const vehicle = { id: 'v1', plate: 'ABC1D23' };
      mockFindVehicleByPlateUseCase.execute.mockResolvedValue(vehicle);

      const result = await service.findByPlate('ABC1D23');

      expect(mockFindVehicleByPlateUseCase.execute).toHaveBeenCalledWith('ABC1D23');
      expect(result).toEqual(vehicle);
    });

    it('should propagate errors when plate not found', async () => {
      mockFindVehicleByPlateUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(service.findByPlate('XYZ0000')).rejects.toThrow('Not found');
    });

    it('should return null/undefined if use case returns it', async () => {
      mockFindVehicleByPlateUseCase.execute.mockResolvedValue(null);

      const result = await service.findByPlate('AAA0000');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------
  // update
  // -----------------------------------------------------------
  describe('update', () => {
    it('should delegate to UpdateVehicleUseCase', async () => {
      const updated = { id: 'v1', color: 'Red' };
      mockUpdateVehicleUseCase.execute.mockResolvedValue(updated);

      const result = await service.update('v1', { color: 'Red' } as any);

      expect(mockUpdateVehicleUseCase.execute).toHaveBeenCalledWith('v1', { color: 'Red' });
      expect(result).toEqual(updated);
    });

    it('should propagate errors from UpdateVehicleUseCase', async () => {
      mockUpdateVehicleUseCase.execute.mockRejectedValue(new Error('fail'));

      await expect(service.update('v1', {} as any)).rejects.toThrow('fail');
    });

    it('should pass partial update fields correctly', async () => {
      const updateDto = { brand: 'Honda', model: 'Fit', year: 2024 } as any;
      mockUpdateVehicleUseCase.execute.mockResolvedValue({ id: 'v1', ...updateDto });

      await service.update('v1', updateDto);

      expect(mockUpdateVehicleUseCase.execute).toHaveBeenCalledWith('v1', updateDto);
    });
  });

  // -----------------------------------------------------------
  // remove
  // -----------------------------------------------------------
  describe('remove', () => {
    it('should delegate to DeleteVehicleUseCase', async () => {
      mockDeleteVehicleUseCase.execute.mockResolvedValue({ deleted: true });

      const result = await service.remove('v1');

      expect(mockDeleteVehicleUseCase.execute).toHaveBeenCalledWith('v1');
      expect(result).toEqual({ deleted: true });
    });

    it('should propagate errors from DeleteVehicleUseCase', async () => {
      mockDeleteVehicleUseCase.execute.mockRejectedValue(new Error('Not found'));

      await expect(service.remove('missing')).rejects.toThrow('Not found');
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('create should handle vehicle without optional plate', async () => {
      const dto = { brand: 'Fiat', model: 'Uno', userId: 'u1' } as any;
      mockCreateVehicleUseCase.execute.mockResolvedValue({ id: 'v1', ...dto, plate: null });

      const result = await service.create(dto);

      expect(result.plate).toBeNull();
    });

    it('findAll with pagination should forward page and perPage', async () => {
      mockFindAllVehiclesUseCase.execute.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({ page: 2, perPage: 5 });

      expect(mockFindAllVehiclesUseCase.execute).toHaveBeenCalledWith({ page: 2, perPage: 5 });
    });

    it('update should not modify fields not included in DTO', async () => {
      const updateDto = { color: 'Blue' } as any;
      mockUpdateVehicleUseCase.execute.mockResolvedValue({ id: 'v1', color: 'Blue', brand: 'Toyota' });

      const result = await service.update('v1', updateDto);

      expect(mockUpdateVehicleUseCase.execute).toHaveBeenCalledWith('v1', { color: 'Blue' });
      expect(result.brand).toBe('Toyota');
    });
  });
});
