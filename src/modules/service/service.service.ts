import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceUseCase, DeleteServiceUseCase, FindAllServicesUseCase, FindServiceByIdUseCase, UpdateServiceUseCase } from './use-cases';

@Injectable()
export class ServiceService {
  constructor(
    private readonly CreateServiceUseCase: CreateServiceUseCase,
    private readonly FindAllServicesUseCase: FindAllServicesUseCase,
    private readonly FindServiceByIdUseCase: FindServiceByIdUseCase,
    private readonly UpdateServiceUseCase: UpdateServiceUseCase,
    private readonly DeleteServiceUseCase: DeleteServiceUseCase,
  ){}
  async create(data: CreateServiceDto) {
    return await this.CreateServiceUseCase.execute(data);
  }

  async findAll() {
    return await this.FindAllServicesUseCase.execute();
  }

  async findOne(id: string) {
    return await this.FindServiceByIdUseCase.execute(id)
  }

  async update(id: string, data: UpdateServiceDto) {
    return await this.UpdateServiceUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.DeleteServiceUseCase.execute(id);
  }
}
