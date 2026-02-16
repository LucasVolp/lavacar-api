import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { FindEvaluationByIdRepository, UpdateEvaluationRepository } from "../repository";
import { UpdateEvaluationDto } from "../dto/update-evaluation.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { StorageService } from "src/modules/storage/storage.service";

@Injectable()
export class UpdateEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: UpdateEvaluationRepository,
        private readonly findByIdRepository: FindEvaluationByIdRepository,
        private readonly storageService: StorageService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateEvaluationDto, user: JwtPayload) {
        try {
            const existing = await this.findByIdRepository.findById(id, user);

            if (!existing) {
                this.logger.warn(`Evaluation not found with ID: ${id}`, UpdateEvaluationUseCase.name);
                throw new NotFoundException('Evaluation not found');
            }

            if (Array.isArray(data.photos)) {
                const nextPhotos = new Set(data.photos);
                const removedPhotos = (existing.photos || []).filter((url) => !nextPhotos.has(url));
                if (removedPhotos.length) {
                    await Promise.allSettled(removedPhotos.map((photoUrl) => this.storageService.deleteFile(photoUrl)));
                }
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
