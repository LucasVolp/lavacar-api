import { Injectable } from '@nestjs/common';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import {
    CreateServiceGroupUseCase,
    DeleteServiceGroupUseCase,
    FindAllServiceGroupUseCase,
    FindServiceGroupByIdUseCase,
    UpdateServiceGroupUseCase
} from './use-cases';

@Injectable()
export class ServiceGroupService {
    constructor(
        private readonly createServiceGroupUseCase: CreateServiceGroupUseCase,
        private readonly findAllServiceGroupUseCase: FindAllServiceGroupUseCase,
        private readonly findServiceGroupByIdUseCase: FindServiceGroupByIdUseCase,
        private readonly updateServiceGroupUseCase: UpdateServiceGroupUseCase,
        private readonly deleteServiceGroupUseCase: DeleteServiceGroupUseCase,
    ) {}

    async create(data: CreateServiceGroupDto) {
        return await this.createServiceGroupUseCase.execute(data);
    }

    async findAll(shopId?: string) {
        return await this.findAllServiceGroupUseCase.execute(shopId);
    }

    async findOne(id: string) {
        return await this.findServiceGroupByIdUseCase.execute(id);
    }

    async update(id: string, data: UpdateServiceGroupDto) {
        return await this.updateServiceGroupUseCase.execute(id, data);
    }

    async remove(id: string) {
        return await this.deleteServiceGroupUseCase.execute(id);
    }
}
