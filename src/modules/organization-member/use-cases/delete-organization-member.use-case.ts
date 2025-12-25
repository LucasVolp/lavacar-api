import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteOrganizationMemberRepository, FindOrganizationMemberByIdRepository } from '../repository';

@Injectable()
export class DeleteOrganizationMemberUseCase {
    constructor(
        private readonly deleteOrganizationMemberRepository: DeleteOrganizationMemberRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const member = await this.findOrganizationMemberByIdRepository.findById(id);

            if (!member) {
                this.logger.warn(`Organization member with id ${id} not found`, DeleteOrganizationMemberUseCase.name);
                throw new NotFoundException('Organization member not found!');
            }

            const deleted = await this.deleteOrganizationMemberRepository.delete(id);
            this.logger.log('Organization member deleted!', DeleteOrganizationMemberUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error deleting organization member',
                cause: err,
                description: 'Error deleting organization member',
            });
            this.logger.error(error.message, err.stack, DeleteOrganizationMemberUseCase.name);
            throw error;
        }
    }
}
