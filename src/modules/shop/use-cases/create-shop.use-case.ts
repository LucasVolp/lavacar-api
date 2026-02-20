import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateShopRepository, FindShopByDocumentRepository, FindShopBySlugRepository } from "../repository";
import { CreateShopDto } from "../dto/create-shop.dto";
import { generateUniqueSlug } from "src/shared/utils";
import { FindUserRepository } from "src/modules/users/repository";
import { FindOrganizationByIdRepository } from "src/modules/organization/repository";

@Injectable()
export class CreateShopUseCase {
    constructor(
        private readonly shopRepository: CreateShopRepository,
        private readonly findBySlugRepository: FindShopBySlugRepository,
        private readonly findShopByDocumentRepository: FindShopByDocumentRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly findOrganizationRepository: FindOrganizationByIdRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(data: CreateShopDto) {
        try {
            const existingSlugs = await this.findBySlugRepository.findAllSlugs();
            const baseSlug = data.slug || data.name;
            const slug = generateUniqueSlug(baseSlug, existingSlugs);

            if (data.ownerId) {
                const userExists = await this.findUserRepository.findById(data.ownerId);
                if (!userExists) {
                    this.logger.warn(`User not found with ID: ${data.ownerId}`, CreateShopUseCase.name);
                    throw new NotFoundException('Owner user not found');
                }
            }

            const organizationExists = await this.findOrganizationRepository.findById(data.organizationId);
            
            if (!organizationExists) {
                this.logger.warn(`Organization not found with ID: ${data.organizationId}`, CreateShopUseCase.name);
                throw new NotFoundException('Organization not found');
            }

            if (!organizationExists.isActive) {
                this.logger.warn(`Organization with ID: ${data.organizationId} is inactive`, CreateShopUseCase.name);
                throw new BadRequestException('Organization is inactive');
            }

            const user = data.ownerId ? await this.findUserRepository.findById(data.ownerId) : null;

            if (!data.document && (organizationExists.document || user?.cpf)) {
                data.document = organizationExists.document ?? user?.cpf ?? undefined;
            }

            if (data.document) {
                const documentAlreadyUsedOutsideOrg =
                    await this.findShopByDocumentRepository.findByDocumentOutsideOrganization(
                        data.document,
                        data.organizationId,
                    );

                if (documentAlreadyUsedOutsideOrg) {
                    this.logger.warn(
                        `Document already used in another organization. document=${data.document}`,
                        CreateShopUseCase.name,
                    );
                    throw new ConflictException('Documento já utilizado por loja de outra organização');
                }
            }

            const shop = await this.shopRepository.create({
                ...data,
                slug,
            });
            this.logger.log(`Shop created with slug: ${shop.slug}`, CreateShopUseCase.name);
            return shop;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof ConflictException) {
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
