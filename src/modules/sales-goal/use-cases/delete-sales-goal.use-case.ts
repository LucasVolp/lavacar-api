import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteSalesGoalRepository, FindSalesGoalByIdRepository } from '../repository';

@Injectable()
export class DeleteSalesGoalUseCase {
    constructor(
        private readonly deleteSalesGoalRepository: DeleteSalesGoalRepository,
        private readonly findSalesGoalRepository: FindSalesGoalByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const existing = await this.findSalesGoalRepository.findById(id);
            if (!existing) {
                this.logger.warn(`Sales goal not found: ${id}`, DeleteSalesGoalUseCase.name);
                throw new NotFoundException('Sales goal not found');
            }

            const deleted = await this.deleteSalesGoalRepository.delete(id);
            this.logger.log(`Sales goal deleted: ${id}`, DeleteSalesGoalUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting sales goal',
            });
            this.logger.error(error.message, err.stack, DeleteSalesGoalUseCase.name);
            throw error;
        }
    }
}
