import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllOrganizationMemberRepository } from '../repository';

@Injectable()
export class FindAllOrganizationMemberUseCase {
    constructor(
        private readonly findAllOrganizationMemberRepository: FindAllOrganizationMemberRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute() {
        try {
            const members = await this.findAllOrganizationMemberRepository.findAll();
            if (!members) {
                this.logger.warn('No organization members found', FindAllOrganizationMemberUseCase.name);
                return [];
            }
            this.logger.log('Organization members found!', FindAllOrganizationMemberUseCase.name);
            return members;
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

    async executeByOrganizationId(organizationId: string) {
        try {
            const members = await this.findAllOrganizationMemberRepository.findByOrganizationId(organizationId);
            if (!members) {
                this.logger.warn(`No members found for organization ${organizationId}`, FindAllOrganizationMemberUseCase.name);
                return [];
            }
            this.logger.log('Organization members found!', FindAllOrganizationMemberUseCase.name);
            return members;
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
