import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllShopManagerRepository } from '../repository';

interface FindAllFilters {
    shopId?: string;
    memberId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopManagerUseCase {
    constructor(
        private readonly findAllShopManagerRepository: FindAllShopManagerRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.findAllShopManagerRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} shop managers`, FindAllShopManagerUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding shop managers',
                cause: err,
                description: 'Error finding shop managers',
            });
            this.logger.error(error.message, err.stack, FindAllShopManagerUseCase.name);
            throw error;
        }
    }

    async executeByShopId(shopId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            const result = await this.findAllShopManagerRepository.findByShopId(shopId, filters);
            this.logger.log(`Found ${result.meta.total} managers for shop ${shopId}`, FindAllShopManagerUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding shop managers',
                cause: err,
                description: 'Error finding shop managers',
            });
            this.logger.error(error.message, err.stack, FindAllShopManagerUseCase.name);
            throw error;
        }
    }

    async executeByMemberId(memberId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            const result = await this.findAllShopManagerRepository.findByMemberId(memberId, filters);
            this.logger.log(`Found ${result.meta.total} shops managed by member ${memberId}`, FindAllShopManagerUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding shop managers',
                cause: err,
                description: 'Error finding shop managers',
            });
            this.logger.error(error.message, err.stack, FindAllShopManagerUseCase.name);
            throw error;
        }
    }
}
