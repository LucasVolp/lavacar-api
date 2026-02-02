import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindSalesGoalByIdRepository } from '../repository';

@Injectable()
export class FindSalesGoalByIdUseCase {
    constructor(
        private readonly findSalesGoalRepository: FindSalesGoalByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const salesGoal = await this.findSalesGoalRepository.findById(id);
            if (!salesGoal) {
                this.logger.warn(`Sales goal not found: ${id}`, FindSalesGoalByIdUseCase.name);
                throw new NotFoundException('Sales goal not found');
            }
            return salesGoal;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goal',
            });
            this.logger.error(error.message, err.stack, FindSalesGoalByIdUseCase.name);
            throw error;
        }
    }
}
