import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { DeleteEvaluationRepository, FindEvaluationByIdRepository } from "../repository";

@Injectable()
export class DeleteEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: DeleteEvaluationRepository,
        private readonly findByIdRepository: FindEvaluationByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const existing = await this.findByIdRepository.findById(id);

            if (!existing) {
                this.logger.warn(`Evaluation not found with ID: ${id}`, DeleteEvaluationUseCase.name);
                throw new NotFoundException('Evaluation not found');
            }

            const deletedEvaluation = await this.evaluationRepository.delete(id);
            this.logger.log(`Evaluation deleted with ID: ${id}`, DeleteEvaluationUseCase.name);
            return deletedEvaluation;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting evaluation',
            });
            this.logger.error(error.message, err.stack, DeleteEvaluationUseCase.name);
            throw error;
        }
    }
}
