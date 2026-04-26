import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleUseCase, DeleteVehicleUseCase, FindAllVehiclesUseCase, FindVehicleByIdUseCase, FindVehicleByPlateUseCase, UpdateVehicleUseCase } from './use-cases';

@Injectable()
export class VehicleService {
  constructor(
    private readonly CreateVehicleUseCase: CreateVehicleUseCase,
    private readonly FindAllVehiclesUseCase: FindAllVehiclesUseCase,
    private readonly FindVehicleByIdUseCase: FindVehicleByIdUseCase,
    private readonly FindVehicleByPlateUseCase: FindVehicleByPlateUseCase,
    private readonly UpdateVehicleUseCase: UpdateVehicleUseCase,
    private readonly DeleteVehicleUseCase: DeleteVehicleUseCase,
  ){}
  async create(data: CreateVehicleDto) {
    return await this.CreateVehicleUseCase.execute(data);
  }

  async findAll(filters?: { userId?: string; page?: number; perPage?: number }) {
    return await this.FindAllVehiclesUseCase.execute(filters);
  }

  async findOne(id: string) {
    return await this.FindVehicleByIdUseCase.execute(id);
  }

  async findByPlate(plate: string) {
    return await this.FindVehicleByPlateUseCase.execute(plate);
  }

  async update(id: string, data: UpdateVehicleDto) {
    return await this.UpdateVehicleUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.DeleteVehicleUseCase.execute(id);
  }
}
