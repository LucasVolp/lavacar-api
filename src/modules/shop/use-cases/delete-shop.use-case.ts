import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteShopRepository, FindShopByIdRepository } from "../repository";

@Injectable()
export class DeleteShopUseCase {
    constructor(
        private readonly ShopRepository: DeleteShopRepository,
        private readonly FindShopByIdRepository: FindShopByIdRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string){
        try {
            const shopExists = await this.FindShopByIdRepository.findById(id);
            if (!shopExists){
                throw new NotFoundException("Shop not found!")
            }
            const shop = await this.ShopRepository.delete(id);
            this.logger.log('Shop Deleted', DeleteShopUseCase.name)
            return shop;
        } catch (err) {
            const error = new ServiceUnavailableException("Something bad happened!", {
                cause: err,
                description: 'Error deleting shop',
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}