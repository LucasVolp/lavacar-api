import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateShopClientDto } from '../dto/create-shop-client.dto';
import { CreateShopClientRepository, FindShopClientByIdRepository } from '../repository';
import { FindShopByIdRepository } from 'src/modules/shop/repository';
import { FindUserRepository } from 'src/modules/users/repository';

@Injectable()
export class CreateShopClientUseCase {
    constructor(
        private readonly createShopClientRepository: CreateShopClientRepository,
        private readonly findShopClientRepository: FindShopClientByIdRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateShopClientDto) {
        try {
            const shop = await this.findShopByIdRepository.findById(data.shopId);
            if (!shop) {
                this.logger.warn(`Shop not found: ${data.shopId}`, CreateShopClientUseCase.name);
                throw new NotFoundException('Shop not found');
            }

            const user = await this.findUserRepository.findById(data.userId);
            if (!user) {
                this.logger.warn(`User not found: ${data.userId}`, CreateShopClientUseCase.name);
                throw new NotFoundException('User not found');
            }

            const existing = await this.findShopClientRepository.findByShopAndUser(data.shopId, data.userId);
            if (existing) {
                this.logger.debug(`Shop client relation already exists for shop ${data.shopId} and user ${data.userId}, returning existing`, CreateShopClientUseCase.name);
                return existing;
            }

            const shopClient = await this.createShopClientRepository.create(data);
            this.logger.log(`Shop client created for shop ${data.shopId} and user ${data.userId}`, CreateShopClientUseCase.name);
            return shopClient;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating shop client',
            });
            this.logger.error(error.message, err.stack, CreateShopClientUseCase.name);
            throw error;
        }
    }
}
