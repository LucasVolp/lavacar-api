import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateShopManagerRepository, FindShopManagerByIdRepository } from '../repository';
import { CreateShopManagerDto } from '../dto';
import { FindOrganizationMemberByIdRepository } from 'src/modules/organization-member/repository';
import { FindShopByIdRepository } from 'src/modules/shop/repository';

@Injectable()
export class CreateShopManagerUseCase {
    constructor(
        private readonly createShopManagerRepository: CreateShopManagerRepository,
        private readonly findShopManagerByIdRepository: FindShopManagerByIdRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateShopManagerDto) {
        try {
            // Verificar se o membro existe
            const member = await this.findOrganizationMemberByIdRepository.findById(data.memberId);
            if (!member) {
                this.logger.warn(`Organization member with id ${data.memberId} not found`, CreateShopManagerUseCase.name);
                throw new NotFoundException('Organization member not found');
            }

            // Verificar se a loja existe
            const shop = await this.findShopByIdRepository.findById(data.shopId);
            if (!shop) {
                this.logger.warn(`Shop with id ${data.shopId} not found`, CreateShopManagerUseCase.name);
                throw new NotFoundException('Shop not found');
            }

            // Verificar se a loja pertence à mesma organização do membro
            if (shop.organizationId !== member.organizationId) {
                this.logger.warn('Shop does not belong to the same organization as the member', CreateShopManagerUseCase.name);
                throw new BadRequestException('Shop does not belong to the same organization as the member');
            }

            // Verificar se já existe essa relação
            const existingManager = await this.findShopManagerByIdRepository.findByShopAndMember(
                data.shopId,
                data.memberId,
            );
            if (existingManager) {
                this.logger.warn('This member is already a manager of this shop', CreateShopManagerUseCase.name);
                throw new BadRequestException('This member is already a manager of this shop');
            }

            const shopManager = await this.createShopManagerRepository.create(data);
            this.logger.log(`Shop manager created for shop: ${shop.name}`, CreateShopManagerUseCase.name);
            return shopManager;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error creating shop manager',
                cause: err,
                description: 'Error creating shop manager',
            });
            this.logger.error(error.message, err.stack, CreateShopManagerUseCase.name);
            throw error;
        }
    }
}
