import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllSalesGoalRepository } from '../repository';

@Injectable()
export class FindAllSalesGoalUseCase {
    constructor(
        private readonly findAllSalesGoalRepository: FindAllSalesGoalRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute() {
        try {
            return await this.findAllSalesGoalRepository.findAll();
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goals',
            });
            this.logger.error(error.message, err.stack, FindAllSalesGoalUseCase.name);
            throw error;
        }
    }

    async executeByShopId(shopId: string) {
        try {
            return await this.findAllSalesGoalRepository.findByShopId(shopId);
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goals',
            });
            this.logger.error(error.message, err.stack, FindAllSalesGoalUseCase.name);
            throw error;
        }
    }

    async executeByOrganizationId(organizationId: string) {
        try {
            return await this.findAllSalesGoalRepository.findByOrganizationId(organizationId);
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goals',
            });
            this.logger.error(error.message, err.stack, FindAllSalesGoalUseCase.name);
            throw error;
        }
    }
}
