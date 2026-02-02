import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindShopClientByIdRepository } from '../repository';

@Injectable()
export class FindShopClientByIdUseCase {
    constructor(
        private readonly findShopClientRepository: FindShopClientByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const shopClient = await this.findShopClientRepository.findById(id);
            if (!shopClient) {
                this.logger.warn(`Shop client not found: ${id}`, FindShopClientByIdUseCase.name);
                throw new NotFoundException('Shop client not found');
            }
            return shopClient;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding shop client',
            });
            this.logger.error(error.message, err.stack, FindShopClientByIdUseCase.name);
            throw error;
        }
    }
}
