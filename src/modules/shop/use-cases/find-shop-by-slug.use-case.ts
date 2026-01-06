import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { FindShopBySlugRepository } from "../repository";

@Injectable()
export class FindShopBySlugUseCase {
    constructor (
        private readonly shopRepository: FindShopBySlugRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(slug: string) {
        try {
            const shop =  await this.shopRepository.findBySlug(slug);
            
            if (!shop) {
                this.logger.warn('Shop not found', FindShopBySlugUseCase.name);
                throw new NotFoundException('Shop not found!');
            }

            this.logger.log("Shop Found!", FindShopBySlugUseCase.name);
            return shop;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            this.logger.error('Error finding shop', FindShopBySlugUseCase.name);
            throw err;
        }
    }
}