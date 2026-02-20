import { Injectable } from '@nestjs/common';
import { CreateServiceVariantDto } from './dto/create-service-variant.dto';
import { UpdateServiceVariantDto } from './dto/update-service-variant.dto';
import {
  CreateServiceVariantUseCase,
  DeleteServiceVariantUseCase,
  FindAllServiceVariantUseCase,
  FindServiceVariantByIdUseCase,
  UpdateServiceVariantUseCase,
} from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class ServiceVariantService {
  constructor(
    private readonly createServiceVariantUseCase: CreateServiceVariantUseCase,
    private readonly findAllServiceVariantUseCase: FindAllServiceVariantUseCase,
    private readonly findServiceVariantByIdUseCase: FindServiceVariantByIdUseCase,
    private readonly updateServiceVariantUseCase: UpdateServiceVariantUseCase,
    private readonly deleteServiceVariantUseCase: DeleteServiceVariantUseCase,
  ) {}

  async create(data: CreateServiceVariantDto, user: JwtPayload) {
    return await this.createServiceVariantUseCase.execute(data, user);
  }

  async findAll(filters: { serviceId?: string; shopId?: string; page?: number; perPage?: number } = {}, user: JwtPayload) {
    return await this.findAllServiceVariantUseCase.execute(filters, user);
  }

  async findOne(id: string, user: JwtPayload) {
    return await this.findServiceVariantByIdUseCase.execute(id, user);
  }

  async update(id: string, data: UpdateServiceVariantDto, user: JwtPayload) {
    return await this.updateServiceVariantUseCase.execute(id, data, user);
  }

  async remove(id: string, user: JwtPayload) {
    return await this.deleteServiceVariantUseCase.execute(id, user);
  }
}
