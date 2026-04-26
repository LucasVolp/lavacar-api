import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindOrganizationMemberByIdRepository } from '../repository';

@Injectable()
export class FindOrganizationMemberByIdUseCase {
    constructor(
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const member = await this.findOrganizationMemberByIdRepository.findById(id);

            if (!member) {
                this.logger.warn(`Organization member with id ${id} not found`, FindOrganizationMemberByIdUseCase.name);
                throw new NotFoundException('Organization member not found!');
            }

            this.logger.log('Organization member found!', FindOrganizationMemberByIdUseCase.name);
            return member;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error finding organization member',
                cause: err,
                description: 'Error finding organization member',
            });
            this.logger.error(error.message, err.stack, FindOrganizationMemberByIdUseCase.name);
            throw error;
        }
    }
}
