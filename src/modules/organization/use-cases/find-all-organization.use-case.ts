import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllOrganizationRepository } from '../repository/find-all-organization.repository';

interface FindAllFilters {
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllOrganizationUseCase {
    constructor(
        private readonly findAllOrganizationRepository: FindAllOrganizationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.findAllOrganizationRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} organizations`, FindAllOrganizationUseCase.name);
            return result;
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
