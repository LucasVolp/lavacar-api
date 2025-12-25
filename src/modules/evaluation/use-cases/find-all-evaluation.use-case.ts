import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllEvaluationRepository } from "../repository";

@Injectable()
export class FindAllEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: FindAllEvaluationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(shopId?: string) {
        try {
            const evaluations = await this.evaluationRepository.findAll(shopId);
            if (evaluations.length === 0) {
                this.logger.log('No evaluations found', FindAllEvaluationUseCase.name);
                return [];
            }
            
            this.logger.log(`Found ${evaluations.length} evaluations`, FindAllEvaluationUseCase.name);
            return evaluations;
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
