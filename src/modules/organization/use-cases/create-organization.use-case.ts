import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrganizationRepository } from '../repository/create-organization.repository';
import { FindOrganizationByIdRepository } from '../repository/find-organization-by-id.repository';
import { FindOrganizationByOwnerRepository } from '../repository/find-organization-by-owner.repository';
import { CreateOrganizationDto } from '../dto';
import { FindUserRepository } from 'src/modules/users/repository';
import { Role } from 'prisma/generated';

@Injectable()
export class CreateOrganizationUseCase {
    constructor(
        private readonly createOrganizationRepository: CreateOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly findOrganizationByOwnerRepository: FindOrganizationByOwnerRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateOrganizationDto, callerRole?: string) {
        try {
            if (callerRole !== Role.ADMIN && data.ownerId) {
                const existingOrg = await this.findOrganizationByOwnerRepository.findByOwnerId(data.ownerId);
                if (existingOrg) {
                    throw new ConflictException('Você já é proprietário de uma organização. O limite é de 1 organização por conta.');
                }
            }

            if (data.document) {
                const organizationExists = await this.findOrganizationByIdRepository.findByDocument(data.document);
                if (organizationExists) {
                    this.logger.warn(`Attempt to create organization with existing document: ${data.document}`);
                    throw new BadRequestException('Organization with this document already exists.');
                }
            }

            if (!data.ownerId) {
                this.logger.warn('Attempt to create organization without ownerId');
                throw new BadRequestException('OwnerId is required to create an organization.');
            }

            const userExists = await this.findUserRepository.findById(data.ownerId);
            if (!userExists) {
                this.logger.warn(`Attempt to create organization with non-existing ownerId: ${data.ownerId}`);
                throw new BadRequestException('Owner user does not exist.');
            }

            return await this.createOrganizationRepository.create(data);
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof ConflictException) {
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
