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
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class ServiceGroupService {
    constructor(
        private readonly createServiceGroupUseCase: CreateServiceGroupUseCase,
        private readonly findAllServiceGroupUseCase: FindAllServiceGroupUseCase,
        private readonly findServiceGroupByIdUseCase: FindServiceGroupByIdUseCase,
        private readonly updateServiceGroupUseCase: UpdateServiceGroupUseCase,
        private readonly deleteServiceGroupUseCase: DeleteServiceGroupUseCase,
    ) {}

    async create(data: CreateServiceGroupDto, user: JwtPayload) {
        return await this.createServiceGroupUseCase.execute(data, user);
    }

    async findAll(filters: { shopId?: string; page?: number; perPage?: number } = {}, user: JwtPayload) {
        return await this.findAllServiceGroupUseCase.execute(filters, user);
    }

    async findOne(id: string, user: JwtPayload) {
        return await this.findServiceGroupByIdUseCase.execute(id, user);
    }

    async update(id: string, data: UpdateServiceGroupDto, user: JwtPayload) {
        return await this.updateServiceGroupUseCase.execute(id, data, user);
    }

    async remove(id: string, user: JwtPayload) {
        return await this.deleteServiceGroupUseCase.execute(id, user);
    }
}
