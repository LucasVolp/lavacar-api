import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindEvaluationByIdRepository } from "../repository";

@Injectable()
export class FindEvaluationByIdUseCase {
    constructor(
        private readonly evaluationRepository: FindEvaluationByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const evaluation = await this.evaluationRepository.findById(id);

            if (!evaluation) {
                throw new NotFoundException('Evaluation not found');
            }

            this.logger.log(`Evaluation found: ${evaluation.id}`, FindEvaluationByIdUseCase.name);
            return evaluation;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding evaluation',
            });
            this.logger.error(error.message, err.stack, FindEvaluationByIdUseCase.name);
            throw error;
        }
    }
}
