import { Injectable, Logger, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { CreateShopRepository, FindShopBySlugRepository } from "../repository";
import { CreateShopDto } from "../dto/create-shop.dto";
import { generateUniqueSlug } from "src/shared/utils";

@Injectable()
export class CreateShopUseCase {
    constructor(
        private readonly shopRepository: CreateShopRepository,
        private readonly findBySlugRepository: FindShopBySlugRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(data: CreateShopDto) {
        try {
            // Gerar slug único baseado no nome
            const existingSlugs = await this.findBySlugRepository.findAllSlugs();
            const slug = generateUniqueSlug(data.name, existingSlugs);

            const shop = await this.shopRepository.create({
                ...data,
                slug,
            });

            this.logger.log(`Shop created with slug: ${slug}`, CreateShopUseCase.name);
            return shop;
        } catch (err) {
            // Verificar se é erro de constraint unique (email, document)
            if (err?.code === 'P2002') {
                const field = err.meta?.target?.[0] || 'field';
                throw new ConflictException(`Shop with this ${field} already exists`);
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