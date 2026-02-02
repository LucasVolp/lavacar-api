import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllShopClientRepository } from '../repository';

@Injectable()
export class FindAllShopClientUseCase {
    constructor(
        private readonly findAllShopClientRepository: FindAllShopClientRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute() {
        try {
            const shopClients = await this.findAllShopClientRepository.findAll();
            return shopClients;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding shop clients',
            });
            this.logger.error(error.message, err.stack, FindAllShopClientUseCase.name);
            throw error;
        }
    }

    async executeByShopId(shopId: string) {
        try {
            const shopClients = await this.findAllShopClientRepository.findByShopId(shopId);
            return shopClients;
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
