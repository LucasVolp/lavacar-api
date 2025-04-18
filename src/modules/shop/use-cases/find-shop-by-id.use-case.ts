import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindShopByIdRepository } from "../repository";

@Injectable()
export class FindShopByIdUseCase{
    constructor(
        private readonly ShopRepository: FindShopByIdRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string) {
        try {
            const shopExists = await this.ShopRepository.findById(id);
            if (!shopExists){
                throw new NotFoundException('Shop not found!');
            }
            this.logger.log("Shop Found!", FindShopByIdUseCase.name)
            return shopExists
        } catch (err) {
            const error = new ServiceUnavailableException("Something Bad Happened!", {
                cause: err,
                description: "Error finding shop",
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}