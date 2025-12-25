import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteShopManagerRepository, FindShopManagerByIdRepository } from '../repository';

@Injectable()
export class DeleteShopManagerUseCase {
    constructor(
        private readonly deleteShopManagerRepository: DeleteShopManagerRepository,
        private readonly findShopManagerByIdRepository: FindShopManagerByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const shopManager = await this.findShopManagerByIdRepository.findById(id);

            if (!shopManager) {
                this.logger.warn(`Shop manager with id ${id} not found`, DeleteShopManagerUseCase.name);
                throw new NotFoundException('Shop manager not found!');
            }

            const deleted = await this.deleteShopManagerRepository.delete(id);
            this.logger.log('Shop manager deleted!', DeleteShopManagerUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error deleting shop manager',
                cause: err,
                description: 'Error deleting shop manager',
            });
            this.logger.error(error.message, err.stack, DeleteShopManagerUseCase.name);
            throw error;
        }
    }
}
