import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateOrganizationRepository, FindOrganizationByIdRepository } from '../repository';
import { UpdateOrganizationDto } from '../dto';
import { FindUserRepository } from 'src/modules/users/repository';

@Injectable()
export class UpdateOrganizationUseCase {
    constructor(
        private readonly updateOrganizationRepository: UpdateOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateOrganizationDto) {
        try {
            const organization = await this.findOrganizationByIdRepository.findById(id);

            if (!organization) {
                this.logger.warn(`Organization with id ${id} not found`, UpdateOrganizationUseCase.name);
                throw new NotFoundException('Organization not found!');
            }

            // Verificar documento duplicado se estiver sendo alterado
            if (data.document && data.document !== organization.document) {
                const existingOrg = await this.findOrganizationByIdRepository.findByDocument(data.document);
                if (existingOrg) {
                    this.logger.warn('Organization with this document already exists', UpdateOrganizationUseCase.name);
                    throw new BadRequestException('Organization with this document already exists');
                }
            }

            if (data.ownerId && data.ownerId !== organization.ownerId) {
                const userExists = await this.findUserRepository.findById(data.ownerId);
                if (!userExists) {
                    this.logger.warn(`Attempt to update organization with non-existing ownerId: ${data.ownerId}`, UpdateOrganizationUseCase.name);
                    throw new BadRequestException('Owner user does not exist.');
                }
            }

            const updatedOrganization = await this.updateOrganizationRepository.update(id, data);
            this.logger.log('Organization updated!', UpdateOrganizationUseCase.name);
            return updatedOrganization;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error updating organization',
                cause: err,
                description: 'Error updating organization',
            });
            this.logger.error(error.message, err.stack, UpdateOrganizationUseCase.name);
            throw error;
        }
    }
}
