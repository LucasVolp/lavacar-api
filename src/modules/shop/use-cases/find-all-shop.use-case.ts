import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllShopRepository } from "../repository";

interface FindAllFilters {
    organizationId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllShopUseCase {
    constructor(
        private readonly ShopRepository: FindAllShopRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(filters: FindAllFilters = {}){
        try {
            const result = await this.ShopRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} shops`, FindAllShopUseCase.name);
            return result;
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