import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { CreateServiceUseCase, DeleteServiceUseCase, FindAllServicesUseCase, FindServiceByIdUseCase, UpdateServiceUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class ServiceService {
  constructor(
    private readonly CreateServiceUseCase: CreateServiceUseCase,
    private readonly FindAllServicesUseCase: FindAllServicesUseCase,
    private readonly FindServiceByIdUseCase: FindServiceByIdUseCase,
    private readonly UpdateServiceUseCase: UpdateServiceUseCase,
    private readonly DeleteServiceUseCase: DeleteServiceUseCase,
  ){}
  async create(data: CreateServiceDto, user: JwtPayload) {
    return await this.CreateServiceUseCase.execute(data, user);
  }

  async findAll(filters: FilterServiceDto = {}, user: JwtPayload) {
    return await this.FindAllServicesUseCase.execute(filters, user);
  }

  async findPublicServices(filters: FilterServiceDto = {}) {
    return await this.FindAllServicesUseCase.executePublic(filters);
  }

  async findOne(id: string, user: JwtPayload) {
    return await this.FindServiceByIdUseCase.execute(id, user)
  }

  async update(id: string, data: UpdateServiceDto, user: JwtPayload) {
    return await this.UpdateServiceUseCase.execute(id, data, user);
  }

  async remove(id: string, user: JwtPayload) {
    return await this.DeleteServiceUseCase.execute(id, user);
  }
}
