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

    async create(data: CreateEvaluationDto) {
        return await this.createEvaluationUseCase.execute(data);
    }

    async findAll(filters?: { shopId?: string; rating?: number; page?: number; perPage?: number }) {
        return await this.findAllEvaluationUseCase.execute(filters);
    }

    async findOne(id: string) {
        return await this.findEvaluationByIdUseCase.execute(id);
    }

    async getShopStats(shopId: string) {
        return await this.getShopStatsUseCase.execute(shopId);
    }

    async update(id: string, data: UpdateEvaluationDto) {
        return await this.updateEvaluationUseCase.execute(id, data);
    }

    async remove(id: string) {
        return await this.deleteEvaluationUseCase.execute(id);
    }
}
