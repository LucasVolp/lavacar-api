import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { DeleteEvaluationRepository, FindEvaluationByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { StorageService } from "src/modules/storage/storage.service";

@Injectable()
export class DeleteEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: DeleteEvaluationRepository,
        private readonly findByIdRepository: FindEvaluationByIdRepository,
        private readonly storageService: StorageService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, user: JwtPayload) {
        try {
            const existing = await this.findByIdRepository.findById(id, user);

            if (!existing) {
                this.logger.warn(`Evaluation not found with ID: ${id}`, DeleteEvaluationUseCase.name);
                throw new NotFoundException('Evaluation not found');
            }

            if (existing.photos?.length) {
                await Promise.allSettled(existing.photos.map((photoUrl) => this.storageService.deleteFile(photoUrl)));
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
