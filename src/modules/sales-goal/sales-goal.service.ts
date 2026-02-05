import { Injectable } from '@nestjs/common';
import { CreateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateSalesGoalDto } from './dto/update-sales-goal.dto';
import {
    CreateSalesGoalUseCase,
    DeleteSalesGoalUseCase,
    FindAllSalesGoalUseCase,
    FindSalesGoalByIdUseCase,
    UpdateSalesGoalUseCase,
} from './use-cases';

@Injectable()
export class SalesGoalService {
    constructor(
        private readonly createSalesGoalUseCase: CreateSalesGoalUseCase,
        private readonly findAllSalesGoalUseCase: FindAllSalesGoalUseCase,
        private readonly findSalesGoalByIdUseCase: FindSalesGoalByIdUseCase,
        private readonly updateSalesGoalUseCase: UpdateSalesGoalUseCase,
        private readonly deleteSalesGoalUseCase: DeleteSalesGoalUseCase,
    ) {}

    async create(data: CreateSalesGoalDto) {
        return await this.createSalesGoalUseCase.execute(data);
    }

    async findAll(filters?: { page?: number; perPage?: number }) {
        return await this.findAllSalesGoalUseCase.execute(filters);
    }

    async findByShopId(shopId: string, filters?: { page?: number; perPage?: number }) {
        return await this.findAllSalesGoalUseCase.executeByShopId(shopId, filters);
    }

    async findByOrganizationId(organizationId: string, filters?: { page?: number; perPage?: number }) {
        return await this.findAllSalesGoalUseCase.executeByOrganizationId(organizationId, filters);
    }

    async findOne(id: string) {
        return await this.findSalesGoalByIdUseCase.execute(id);
    }

    async update(id: string, data: UpdateSalesGoalDto) {
        return await this.updateSalesGoalUseCase.execute(id, data);
    }

    async remove(id: string) {
        return await this.deleteSalesGoalUseCase.execute(id);
    }
}