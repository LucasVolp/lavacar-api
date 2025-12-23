import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { FindEvaluationByIdRepository, UpdateEvaluationRepository } from "../repository";
import { UpdateEvaluationDto } from "../dto/update-evaluation.dto";

@Injectable()
export class UpdateEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: UpdateEvaluationRepository,
        private readonly findByIdRepository: FindEvaluationByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateEvaluationDto, userId?: string) {
        try {
            const existing = await this.findByIdRepository.findById(id);

            if (!existing) {
                throw new NotFoundException('Evaluation not found');
            }

            // Verificar se o usuário é o dono da avaliação
            if (userId && existing.userId !== userId) {
                throw new BadRequestException('You can only update your own evaluations');
            }

            const evaluation = await this.evaluationRepository.update(id, data);
            this.logger.log(`Evaluation updated: ${evaluation.id}`, UpdateEvaluationUseCase.name);
            return evaluation;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating evaluation',
            });
            this.logger.error(error.message, err.stack, UpdateEvaluationUseCase.name);
            throw error;
        }
    }
}
