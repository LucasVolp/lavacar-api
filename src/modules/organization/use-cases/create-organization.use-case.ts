import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrganizationRepository } from '../repository/create-organization.repository';
import { FindOrganizationByIdRepository } from '../repository/find-organization-by-id.repository';
import { CreateOrganizationDto } from '../dto';
import { FindUserRepository } from 'src/modules/users/repository';

@Injectable()
export class CreateOrganizationUseCase {
    constructor(
        private readonly createOrganizationRepository: CreateOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
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

            if (data.ownerId) {
                const userExists = await this.findUserRepository.findById(data.ownerId);
                if (!userExists) {
                    this.logger.warn(`Attempt to create organization with non-existing ownerId: ${data.ownerId}`);
                    throw new BadRequestException('Owner user does not exist.');
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
