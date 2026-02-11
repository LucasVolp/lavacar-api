import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { CreateServiceUseCase, DeleteServiceUseCase, FindAllServicesUseCase, FindServiceByIdUseCase, UpdateServiceUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { OwnershipService } from 'src/shared/services/ownership.service';

@Injectable()
export class ServiceService {
  constructor(
    private readonly CreateServiceUseCase: CreateServiceUseCase,
    private readonly FindAllServicesUseCase: FindAllServicesUseCase,
    private readonly FindServiceByIdUseCase: FindServiceByIdUseCase,
    private readonly UpdateServiceUseCase: UpdateServiceUseCase,
    private readonly DeleteServiceUseCase: DeleteServiceUseCase,
    private readonly ownershipService: OwnershipService,
  ){}
  async create(data: CreateServiceDto, user: JwtPayload) {
    await this.ownershipService.assertShopAccess(user.id, user.role, data.shopId);
    return await this.CreateServiceUseCase.execute(data);
  }

  async findAll(filters?: FilterServiceDto) {
    return await this.FindAllServicesUseCase.execute(filters);
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
