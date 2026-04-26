import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateShopClientRepository, FindShopClientByIdRepository } from '../repository';
import { UpdateShopClientDto } from '../dto/update-shop-client.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class UpdateShopClientUseCase {
    constructor(
        private readonly updateShopClientRepository: UpdateShopClientRepository,
        private readonly findShopClientByIdRepository: FindShopClientByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateShopClientDto, user: JwtPayload) {
        try {
            const shopClient = await this.findShopClientByIdRepository.findById(id, user);
            if (!shopClient) {
                throw new NotFoundException('Shop client not found');
            }

            const updated = await this.updateShopClientRepository.update(id, data);
            this.logger.log(`Shop client ${id} updated`, UpdateShopClientUseCase.name);
            return updated;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating shop client',
            });
            this.logger.error(error.message, err.stack, UpdateShopClientUseCase.name);
            throw error;
        }
    }
}
