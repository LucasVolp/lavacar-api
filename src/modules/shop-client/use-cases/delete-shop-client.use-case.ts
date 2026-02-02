import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteShopClientRepository, FindShopClientByIdRepository } from '../repository';

@Injectable()
export class DeleteShopClientUseCase {
    constructor(
        private readonly deleteShopClientRepository: DeleteShopClientRepository,
        private readonly findShopClientByIdRepository: FindShopClientByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const existing = await this.findShopClientByIdRepository.findById(id);
            if (!existing) {
                this.logger.warn(`Shop client not found: ${id}`, DeleteShopClientUseCase.name);
                throw new NotFoundException('Shop client not found');
            }

            const deleted = await this.deleteShopClientRepository.delete(id);
            this.logger.log(`Shop client deleted: ${id}`, DeleteShopClientUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting shop client',
            });
            this.logger.error(error.message, err.stack, DeleteShopClientUseCase.name);
            throw error;
        }
    }
}
