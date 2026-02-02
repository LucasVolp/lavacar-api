import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindChecklistByIdRepository, UpdateChecklistRepository } from '../repository';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';

@Injectable()
export class UpdateChecklistUseCase {
    constructor(
        private readonly updateChecklistRepository: UpdateChecklistRepository,
        private readonly findChecklistRepository: FindChecklistByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateChecklistDto) {
        try {
            const existing = await this.findChecklistRepository.findById(id);
            if (!existing) {
                this.logger.warn(`Checklist not found: ${id}`, UpdateChecklistUseCase.name);
                throw new NotFoundException('Checklist not found');
            }

            const updated = await this.updateChecklistRepository.update(id, data);
            this.logger.log(`Checklist updated: ${id}`, UpdateChecklistUseCase.name);
            return updated;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating checklist',
            });
            this.logger.error(error.message, err.stack, UpdateChecklistUseCase.name);
            throw error;
        }
    }
}
