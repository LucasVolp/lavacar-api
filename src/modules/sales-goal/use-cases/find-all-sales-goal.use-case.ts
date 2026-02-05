import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllSalesGoalRepository } from '../repository';

interface FindAllFilters {
    shopId?: string;
    organizationId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllSalesGoalUseCase {
    constructor(
        private readonly findAllSalesGoalRepository: FindAllSalesGoalRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            return await this.findAllSalesGoalRepository.findAll(filters);
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goals',
            });
            this.logger.error(error.message, err.stack, FindAllSalesGoalUseCase.name);
            throw error;
        }
    }

    async executeByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            return await this.findAllSalesGoalRepository.findByShopId(shopId, filters);
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding sales goals',
            });
            this.logger.error(error.message, err.stack, FindAllSalesGoalUseCase.name);
            throw error;
        }
    }

    async executeByOrganizationId(organizationId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            return await this.findAllSalesGoalRepository.findByOrganizationId(organizationId, filters);
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
