import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllShopRepository } from "../repository";

@Injectable()
export class FindAllShopUseCase {
    constructor(
        private readonly ShopRepository: FindAllShopRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(){
        try {
            const shops = await this.ShopRepository.findAll();
            if (!shops || shops.length === 0) {
                this.logger.warn('No shops found', FindAllShopUseCase.name);
                return [];
            }
            return shops;
        } catch (err) {
            const error = new ServiceUnavailableException("Something bad Happened!", {
                cause: err,
                description: "Error finding shop",
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}