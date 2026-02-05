import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllOrganizationMemberRepository } from '../repository';

interface FindAllFilters {
    organizationId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllOrganizationMemberUseCase {
    constructor(
        private readonly findAllOrganizationMemberRepository: FindAllOrganizationMemberRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.findAllOrganizationMemberRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} organization members`, FindAllOrganizationMemberUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding organization members',
                cause: err,
                description: 'Error finding organization members',
            });
            this.logger.error(error.message, err.stack, FindAllOrganizationMemberUseCase.name);
            throw error;
        }
    }

    async executeByOrganizationId(organizationId: string, filters: { page?: number; perPage?: number } = {}) {
        try {
            const result = await this.findAllOrganizationMemberRepository.findByOrganizationId(organizationId, filters);
            this.logger.log(`Found ${result.meta.total} members for organization ${organizationId}`, FindAllOrganizationMemberUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding organization members',
                cause: err,
                description: 'Error finding organization members',
            });
            this.logger.error(error.message, err.stack, FindAllOrganizationMemberUseCase.name);
            throw error;
        }
    }
}
