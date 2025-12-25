import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindShopManagerByIdRepository } from '../repository';

@Injectable()
export class FindShopManagerByIdUseCase {
    constructor(
        private readonly findShopManagerByIdRepository: FindShopManagerByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const shopManager = await this.findShopManagerByIdRepository.findById(id);

            if (!shopManager) {
                this.logger.warn(`Shop manager with id ${id} not found`, FindShopManagerByIdUseCase.name);
                throw new NotFoundException('Shop manager not found!');
            }

            this.logger.log('Shop manager found!', FindShopManagerByIdUseCase.name);
            return shopManager;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error finding shop manager',
                cause: err,
                description: 'Error finding shop manager',
            });
            this.logger.error(error.message, err.stack, FindShopManagerByIdUseCase.name);
            throw error;
        }
    }
}
