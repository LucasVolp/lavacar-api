import { Injectable } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import {
    CreateEvaluationUseCase,
    DeleteEvaluationUseCase,
    FindAllEvaluationUseCase,
    FindEvaluationByIdUseCase,
    GetShopStatsUseCase,
    UpdateEvaluationUseCase,
} from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class EvaluationService {
    constructor(
        private readonly createEvaluationUseCase: CreateEvaluationUseCase,
        private readonly findAllEvaluationUseCase: FindAllEvaluationUseCase,
        private readonly findEvaluationByIdUseCase: FindEvaluationByIdUseCase,
        private readonly getShopStatsUseCase: GetShopStatsUseCase,
        private readonly updateEvaluationUseCase: UpdateEvaluationUseCase,
        private readonly deleteEvaluationUseCase: DeleteEvaluationUseCase,
    ) {}

    async create(data: CreateEvaluationDto, user: JwtPayload) {
        return await this.createEvaluationUseCase.execute(data, user);
    }

    async findAll(filters: { shopId?: string; userId?: string; rating?: number; page?: number; perPage?: number } = {}, user: JwtPayload) {
        return await this.findAllEvaluationUseCase.execute(filters, user);
    }

    async findPublicByShop(filters: { shopId: string; rating?: number; page?: number; perPage?: number }) {
        return await this.findAllEvaluationUseCase.executePublic(filters);
    }

    async findOne(id: string, user: JwtPayload) {
        return await this.findEvaluationByIdUseCase.execute(id, user);
    }

    async getShopStats(shopId: string, user: JwtPayload) {
        return await this.getShopStatsUseCase.execute(shopId, user);
    }

    async getPublicShopStats(shopId: string) {
        return await this.getShopStatsUseCase.executePublic(shopId);
    }

    async update(id: string, data: UpdateEvaluationDto, user: JwtPayload) {
        return await this.updateEvaluationUseCase.execute(id, data, user);
    }

    async remove(id: string, user: JwtPayload) {
        return await this.deleteEvaluationUseCase.execute(id, user);
    }
}
