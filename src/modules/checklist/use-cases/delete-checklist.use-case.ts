import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteChecklistRepository, FindChecklistByIdRepository } from '../repository';

@Injectable()
export class DeleteChecklistUseCase {
    constructor(
        private readonly deleteChecklistRepository: DeleteChecklistRepository,
        private readonly findChecklistRepository: FindChecklistByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const existing = await this.findChecklistRepository.findById(id);
            if (!existing) {
                this.logger.warn(`Checklist not found: ${id}`, DeleteChecklistUseCase.name);
                throw new NotFoundException('Checklist not found');
            }

            const deleted = await this.deleteChecklistRepository.delete(id);
            this.logger.log(`Checklist deleted: ${id}`, DeleteChecklistUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting checklist',
            });
            this.logger.error(error.message, err.stack, DeleteChecklistUseCase.name);
            throw error;
        }
    }
}
