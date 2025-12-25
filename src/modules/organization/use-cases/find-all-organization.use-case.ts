import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllOrganizationRepository } from '../repository/find-all-organization.repository';

@Injectable()
export class FindAllOrganizationUseCase {
    constructor(
        private readonly findAllOrganizationRepository: FindAllOrganizationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute() {
        try {
            const organizations = await this.findAllOrganizationRepository.findAll();
            if (organizations.length === 0) {
                this.logger.warn('No organizations found in the system.');
                return [];
            }
            return organizations;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error retrieving Organizations'
            });
            this.logger.error(error.message, err.stack, FindAllOrganizationUseCase.name);
            throw error;
        }
    }
}
