import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindOrganizationByIdRepository } from '../repository';

@Injectable()
export class FindOrganizationByIdUseCase {
    constructor(
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const organization = await this.findOrganizationByIdRepository.findById(id);

            if (!organization) {
                this.logger.warn(`Organization with id ${id} not found`, FindOrganizationByIdUseCase.name);
                throw new NotFoundException('Organization not found!');
            }

            this.logger.log('Organization found!', FindOrganizationByIdUseCase.name);
            return organization;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error finding organization',
                cause: err,
                description: 'Error finding organization',
            });
            this.logger.error(error.message, err.stack, FindOrganizationByIdUseCase.name);
            throw error;
        }
    }

    async executeBySlug(slug: string) {
        try {
            const organization = await this.findOrganizationByIdRepository.findBySlug(slug);

            if (!organization) {
                this.logger.warn(`Organization with slug ${slug} not found`, FindOrganizationByIdUseCase.name);
                throw new NotFoundException('Organization not found!');
            }

            this.logger.log('Organization found!', FindOrganizationByIdUseCase.name);
            return organization;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error finding organization',
                cause: err,
                description: 'Error finding organization',
            });
            this.logger.error(error.message, err.stack, FindOrganizationByIdUseCase.name);
            throw error;
        }
    }
}
