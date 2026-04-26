import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllEvaluationRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

interface FindAllFilters {
    shopId?: string;
    userId?: string;
    rating?: number;
    page?: number;
    perPage?: number;
}

interface FindPublicFilters {
    shopId: string;
    rating?: number;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: FindAllEvaluationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}, user: JwtPayload) {
        try {
            const result = await this.evaluationRepository.findAll(filters, user);
            this.logger.log(`Found ${result.meta.total} evaluations`, FindAllEvaluationUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding evaluations',
            });
            this.logger.error(error.message, err.stack, FindAllEvaluationUseCase.name);
            throw error;
        }
    }

    async executePublic(filters: FindPublicFilters) {
        try {
            const result = await this.evaluationRepository.findPublicByShop(filters);
            this.logger.log(`Found ${result.meta.total} public evaluations`, FindAllEvaluationUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding public evaluations',
            });
            this.logger.error(error.message, err.stack, FindAllEvaluationUseCase.name);
            throw error;
        }
    }
}
