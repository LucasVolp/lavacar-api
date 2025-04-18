import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateShopRepository } from "../repository";
import { CreateShopDto } from "../dto/create-shop.dto";

@Injectable()
export class CreateShopUseCase {
    constructor(
        private readonly ShopRepository: CreateShopRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(data: CreateShopDto){
        try {
            const shop = await this.ShopRepository.create(data)
            this.logger.log('Shop created!', CreateShopUseCase.name)
            return shop;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: "Error creating shop!"
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}