import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindShopByDocumentRepository, FindShopByIdRepository, FindShopBySlugRepository, UpdateShopRepository } from "../repository";
import { UpdateShopDto } from "../dto/update-shop.dto";
import { FindUserRepository } from "src/modules/users/repository";
import { FindOrganizationByIdRepository } from "src/modules/organization/repository";

@Injectable()
export class UpdateShopUseCase {
    constructor(
        private readonly ShopRepository: UpdateShopRepository,
        private readonly FindShopByIdRepository: FindShopByIdRepository,
        private readonly findShopByDocumentRepository: FindShopByDocumentRepository,
        private readonly findUserByIdRepository: FindUserRepository,
        private readonly findShopBySlugRepository: FindShopBySlugRepository,
        private readonly findOrganizationRepository: FindOrganizationByIdRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string, data: UpdateShopDto) {
        try {
            const shopExists = await this.FindShopByIdRepository.findById(id);
            if (!shopExists) {
                this.logger.warn('Shop not found', UpdateShopUseCase.name);
                throw new NotFoundException('Shop not found!');
            }
            if (data.ownerId) {
                const userExists = await this.findUserByIdRepository.findById(data.ownerId);
                if (!userExists) {
                    this.logger.warn(`User not found with ID: ${data.ownerId}`, UpdateShopUseCase.name);
                    throw new NotFoundException('Owner user not found');
                }
            }

            if (data.organizationId) {
                const organizationExists = await this.findOrganizationRepository.findById(data.organizationId);
                if (!organizationExists) {
                    this.logger.warn(`Organization not found with ID: ${data.organizationId}`, UpdateShopUseCase.name);
                    throw new NotFoundException('Organization not found');
                }
            }

            if (data.slug) {
                const slugInUse = await this.findShopBySlugRepository.findBySlug(data.slug);
                if (slugInUse && slugInUse.id !== id) {
                    this.logger.warn(`Slug already in use: ${data.slug}`, UpdateShopUseCase.name);
                    throw new ConflictException('Slug already in use');
                }
            }

            if (data.document) {
                const targetOrganizationId = data.organizationId || shopExists.organizationId;
                const documentAlreadyUsedOutsideOrg =
                    await this.findShopByDocumentRepository.findByDocumentOutsideOrganization(
                        data.document,
                        targetOrganizationId,
                        id,
                    );

                if (documentAlreadyUsedOutsideOrg) {
                    this.logger.warn(
                        `Document already used in another organization. document=${data.document}`,
                        UpdateShopUseCase.name,
                    );
                    throw new ConflictException('Documento já utilizado por loja de outra organização');
                }
            }


            const shop = await this.ShopRepository.update(id, data);
            this.logger.log('Shop updated!', UpdateShopUseCase.name);
            return shop;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof ConflictException) {
                throw err;
            }
            const error = new ServiceUnavailableException("Something bad happened!", {
                cause: err,
                description: "Error updating shop!"
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}
