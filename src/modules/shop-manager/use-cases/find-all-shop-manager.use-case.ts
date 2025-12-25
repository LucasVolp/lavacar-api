import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllShopManagerRepository } from '../repository';

@Injectable()
export class FindAllShopManagerUseCase {
    constructor(
        private readonly findAllShopManagerRepository: FindAllShopManagerRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute() {
        try {
            const shopManagers = await this.findAllShopManagerRepository.findAll();
            if (!shopManagers) {
                this.logger.warn('No shop managers found', FindAllShopManagerUseCase.name);
                return [];
            }
            this.logger.log('Shop managers found!', FindAllShopManagerUseCase.name);
            return shopManagers;
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

    async executeByShopId(shopId: string) {
        try {
            const shopManagers = await this.findAllShopManagerRepository.findByShopId(shopId);
            if (!shopManagers) {
                this.logger.warn(`No managers found for shop ${shopId}`, FindAllShopManagerUseCase.name);
                return [];
            }
            this.logger.log('Shop managers found!', FindAllShopManagerUseCase.name);
            return shopManagers;
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

    async executeByMemberId(memberId: string) {
        try {
            const shopManagers = await this.findAllShopManagerRepository.findByMemberId(memberId);
            if (!shopManagers) {
                this.logger.warn(`No shops managed by member ${memberId}`, FindAllShopManagerUseCase.name);
                return [];
            }
            this.logger.log('Shop managers found!', FindAllShopManagerUseCase.name);
            return shopManagers;
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
