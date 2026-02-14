import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateSalesGoalDto } from './dto/update-sales-goal.dto';
import {
    CreateSalesGoalUseCase,
    DeleteSalesGoalUseCase,
    FindAllSalesGoalUseCase,
    FindSalesGoalByIdUseCase,
    UpdateSalesGoalUseCase,
} from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class SalesGoalService {
    constructor(
        private readonly createSalesGoalUseCase: CreateSalesGoalUseCase,
        private readonly findAllSalesGoalUseCase: FindAllSalesGoalUseCase,
        private readonly findSalesGoalByIdUseCase: FindSalesGoalByIdUseCase,
        private readonly updateSalesGoalUseCase: UpdateSalesGoalUseCase,
        private readonly deleteSalesGoalUseCase: DeleteSalesGoalUseCase,
    ) {}

    async create(data: CreateSalesGoalDto, user: JwtPayload) {
        if (!['OWNER', 'MANAGER', 'ADMIN'].includes(user.role)) {
            throw new ForbiddenException('Only OWNER, MANAGER or ADMIN can create sales goals');
        }
        return await this.createSalesGoalUseCase.execute(data, user);
    }

    async findAll(filters: { page?: number; perPage?: number } = {}, user: JwtPayload) {
        return await this.findAllSalesGoalUseCase.execute(filters, user);
    }

    async findByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}, user: JwtPayload) {
        return await this.findAllSalesGoalUseCase.executeByShopId(shopId, filters, user);
    }

    async findByOrganizationId(organizationId: string, filters: { page?: number; perPage?: number } = {}, user: JwtPayload) {
        return await this.findAllSalesGoalUseCase.executeByOrganizationId(organizationId, filters, user);
    }

    async findOne(id: string, user: JwtPayload) {
        return await this.findSalesGoalByIdUseCase.execute(id, user);
    }

    async update(id: string, data: UpdateSalesGoalDto, user: JwtPayload) {
        return await this.updateSalesGoalUseCase.execute(id, data, user);
    }

    async remove(id: string, user: JwtPayload) {
        return await this.deleteSalesGoalUseCase.execute(id, user);
    }
}
