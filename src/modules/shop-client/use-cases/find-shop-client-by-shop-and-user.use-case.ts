import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindShopClientByShopAndUserRepository } from "../repository";
import { FindShopByIdRepository } from '../../shop/repository/find-shop-by-id.repository';
import { FindUserRepository } from "src/modules/users/repository";

@Injectable()
export class FindShopClientByShopAndUserUseCase {
    constructor (
        private readonly shopClientRepository: FindShopClientByShopAndUserRepository,
        private readonly shopRepository: FindShopByIdRepository,
        private readonly userRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(shopId: string, userId: string) {
        try {
            if (!shopId || !userId) {
                this.logger.warn('Shop ID and User ID must be provided', FindShopClientByShopAndUserUseCase.name);
                throw new BadRequestException('Shop ID and User ID must be provided');
            }

            const shopExists = await this.shopRepository.findById(shopId);
            if (!shopExists) {
                this.logger.warn(`Shop with ID: ${shopId} not found`, FindShopClientByShopAndUserUseCase.name);
                throw new NotFoundException('Shop not found');
            }

            const userExists = await this.userRepository.findById(userId);
            if (!userExists) {
                this.logger.warn(`User with ID: ${userId} not found`, FindShopClientByShopAndUserUseCase.name);
                throw new NotFoundException('User not found');
            }

            const shopClient = await this.shopClientRepository.findByShopAndUser(shopId, userId);

            if (!shopClient) {
                this.logger.warn(`Shop client relationship not found for shop ID: ${shopId} and user ID: ${userId}`, FindShopClientByShopAndUserUseCase.name);
                throw new NotFoundException('Shop client relationship not found');
            }

            this.logger.log(`Shop client relationship found for shop ID: ${shopId} and user ID: ${userId}`, FindShopClientByShopAndUserUseCase.name);
            return shopClient;
            
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened', {
                cause: err,
                description: 'Error finding shop client relationship by shop and user',
            })
            this.logger.error(error.message);
            throw error;
        }
    }
}