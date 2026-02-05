import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllShopClientRepository } from '../repository';

interface FindAllFilters {
    shopId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopClientUseCase {
    constructor(
        private readonly findAllShopClientRepository: FindAllShopClientRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.findAllShopClientRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} shop clients`, FindAllShopClientUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding shop clients',
            });
            this.logger.error(error.message, err.stack, FindAllShopClientUseCase.name);
            throw error;
        }
    }

    async executeByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            const result = await this.findAllShopClientRepository.findByShopId(shopId, filters);
            this.logger.log(`Found ${result.meta.total} clients for shop ${shopId}`, FindAllShopClientUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding shop clients',
            });
            this.logger.error(error.message, err.stack, FindAllShopClientUseCase.name);
            throw error;
        }
    }
}
