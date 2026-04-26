import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindOrganizationMembersByShopRepository } from '../repository';

@Injectable()
export class FindOrganizationMembersByShopUseCase {
    constructor(
        private readonly findOrganizationMembersByShopRepository: FindOrganizationMembersByShopRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(shopId: string) {
        try {
            if (!shopId) throw new NotFoundException('Shop ID is required');

            const members = await this.findOrganizationMembersByShopRepository.findByShopId(shopId);

            this.logger.log(
                `Found ${members.length} members for shop ${shopId}`,
                FindOrganizationMembersByShopUseCase.name,
            );

            return members;
        } catch (err) {
            if (err instanceof NotFoundException) throw err;
            const error = new ServiceUnavailableException({
                message: 'Error finding organization members by shop',
                cause: err,
                description: 'Error finding organization members by shop',
            });
            this.logger.error(error.message, err.stack, FindOrganizationMembersByShopUseCase.name);
            throw error;
        }
    }
}
