import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateShopManagerRepository, FindShopManagerByIdRepository } from '../repository';
import { UpdateShopManagerDto } from '../dto';
import { FindOrganizationMemberByIdRepository } from 'src/modules/organization-member/repository';
import { FindShopByIdRepository } from 'src/modules/shop/repository';

@Injectable()
export class UpdateShopManagerUseCase {
    constructor(
        private readonly updateShopManagerRepository: UpdateShopManagerRepository,
        private readonly findShopManagerByIdRepository: FindShopManagerByIdRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateShopManagerDto) {
        try {
            const shopManager = await this.findShopManagerByIdRepository.findById(id);

            if (!shopManager) {
                this.logger.warn(`Shop manager with id ${id} not found`, UpdateShopManagerUseCase.name);
                throw new NotFoundException('Shop manager not found!');
            }

            // Se estiver alterando o membro, verificar se existe
            if (data.memberId && data.memberId !== shopManager.memberId) {
                const member = await this.findOrganizationMemberByIdRepository.findById(data.memberId);
                if (!member) {
                    this.logger.warn(`Organization member with id ${data.memberId} not found`, UpdateShopManagerUseCase.name);
                    throw new NotFoundException('Organization member not found');
                }
            }

            // Se estiver alterando a loja, verificar se existe
            if (data.shopId && data.shopId !== shopManager.shopId) {
                const shop = await this.findShopByIdRepository.findById(data.shopId);
                if (!shop) {
                    this.logger.warn(`Shop with id ${data.shopId} not found`, UpdateShopManagerUseCase.name);
                    throw new NotFoundException('Shop not found');
                }
            }

            // Verificar duplicidade se ambos forem alterados
            const finalShopId = data.shopId ?? shopManager.shopId;
            const finalMemberId = data.memberId ?? shopManager.memberId;

            if (data.shopId || data.memberId) {
                const existingManager = await this.findShopManagerByIdRepository.findByShopAndMember(
                    finalShopId,
                    finalMemberId,
                );
                if (existingManager && existingManager.id !== id) {
                    this.logger.warn('This member is already a manager of this shop', UpdateShopManagerUseCase.name);
                    throw new BadRequestException('This member is already a manager of this shop');
                }
            }

            const updatedShopManager = await this.updateShopManagerRepository.update(id, data);
            this.logger.log('Shop manager updated!', UpdateShopManagerUseCase.name);
            return updatedShopManager;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error updating shop manager',
                cause: err,
                description: 'Error updating shop manager',
            });
            this.logger.error(error.message, err.stack, UpdateShopManagerUseCase.name);
            throw error;
        }
    }
}
