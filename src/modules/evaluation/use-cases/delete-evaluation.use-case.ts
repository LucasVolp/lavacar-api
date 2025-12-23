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

    async execute(id: string, userId?: string) {
        try {
            const existing = await this.findByIdRepository.findById(id);

            if (!existing) {
                throw new NotFoundException('Evaluation not found');
            }

            // Verificar se o usuário é o dono da avaliação
            if (userId && existing.userId !== userId) {
                throw new BadRequestException('You can only delete your own evaluations');
            }

            await this.evaluationRepository.delete(id);
            this.logger.log(`Evaluation deleted: ${id}`, DeleteEvaluationUseCase.name);

            return { message: 'Evaluation deleted successfully' };
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
