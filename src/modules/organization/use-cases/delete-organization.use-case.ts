import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteOrganizationRepository } from '../repository/delete-organization.repository';
import { FindOrganizationByIdRepository } from '../repository/find-organization-by-id.repository';

@Injectable()
export class DeleteOrganizationUseCase {
    constructor(
        private readonly deleteOrganizationRepository: DeleteOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const organization = await this.findOrganizationByIdRepository.findById(id);
            if (!organization) {
                this.logger.warn(`Attempt to delete non-existing organization with id: ${id}`);
                throw new NotFoundException('Organization not found.');
            }

            return await this.deleteOrganizationRepository.delete(id);
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting Organization'
            });
            this.logger.error(error.message, err.stack, DeleteOrganizationUseCase.name);
            throw error;
        }
    }
}
