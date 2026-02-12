import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllEvaluationRepository } from "../repository";

interface FindAllFilters {
    shopId?: string;
    userId?: string;
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

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.evaluationRepository.findAll(filters);
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
}
