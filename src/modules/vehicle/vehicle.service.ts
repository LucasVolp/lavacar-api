import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CreateVehicleUseCase, DeleteVehicleUseCase, FindAllVehiclesUseCase, FindVehicleByIdUseCase, UpdateVehicleUseCase } from './use-cases';

@Injectable()
export class VehicleService {
  constructor(
    private readonly CreateVehicleUseCase: CreateVehicleUseCase,
    private readonly FindAllVehiclesUseCase: FindAllVehiclesUseCase,
    private readonly FindVehicleByIdUseCase: FindVehicleByIdUseCase,
    private readonly UpdateVehicleUseCase: UpdateVehicleUseCase,
    private readonly DeleteVehicleUseCase: DeleteVehicleUseCase,
  ){}
  async create(data: CreateVehicleDto) {
    return await this.CreateVehicleUseCase.execute(data);
  }

  async findAll() {
    return await this.FindAllVehiclesUseCase.execute();
  }

  async findOne(id: string) {
    return await this.FindVehicleByIdUseCase.execute(id);
  }

  async update(id: string, data: UpdateVehicleDto) {
    return await this.UpdateVehicleUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.DeleteVehicleUseCase.execute(id);
  }
}
