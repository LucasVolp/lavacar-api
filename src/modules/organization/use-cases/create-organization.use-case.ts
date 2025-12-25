import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrganizationRepository } from '../repository/create-organization.repository';
import { FindOrganizationByIdRepository } from '../repository/find-organization-by-id.repository';
import { CreateOrganizationDto } from '../dto';

@Injectable()
export class CreateOrganizationUseCase {
    constructor(
        private readonly createOrganizationRepository: CreateOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly logger = new Logger()
    ) {}

    async execute(data: CreateOrganizationDto) {
        try {
            if (data.document) {
                const organizationExists = await this.findOrganizationByIdRepository.findByDocument(data.document);
                if (organizationExists) {
                    this.logger.warn(`Attempt to create organization with existing document: ${data.document}`);
                    throw new BadRequestException('Organization with this document already exists.');
                }
            }

            return await this.createOrganizationRepository.create(data);
        } catch (err) {
            if (err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating Organization'
            });
            this.logger.error(error.message, err.stack, CreateOrganizationUseCase.name);
            throw error;
        }
    }
}
