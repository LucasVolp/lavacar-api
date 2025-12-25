import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateShopRepository, FindShopBySlugRepository } from "../repository";
import { CreateShopDto } from "../dto/create-shop.dto";
import { generateUniqueSlug } from "src/shared/utils";
import { FindUserRepository } from "src/modules/users/repository";

@Injectable()
export class CreateShopUseCase {
    constructor(
        private readonly shopRepository: CreateShopRepository,
        private readonly findBySlugRepository: FindShopBySlugRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(data: CreateShopDto) {
        try {
            const existingSlugs = await this.findBySlugRepository.findAllSlugs();
            const slug = generateUniqueSlug(data.name, existingSlugs);

            const userExists = await this.findUserRepository.findById(data.ownerId);
            if (!userExists) {
                this.logger.warn(`User not found with ID: ${data.ownerId}`, CreateShopUseCase.name);
                throw new NotFoundException('Owner user not found');
            }

            // FAZER DEPOIS QUE ORGANIZATION ESTIVER PRONTA
            // if (!data.document) {
            //     data.document = userExists.;
            // }

            const shop = await this.shopRepository.create({
                ...data,
                slug,
            });
            this.logger.log(`Shop created with slug: ${shop.slug}`, CreateShopUseCase.name);
            return shop;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: "Error creating shop!"
            });
            this.logger.error(error.message, err.stack, CreateShopUseCase.name);
            throw error;
        }
    }
}