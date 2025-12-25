import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrganizationMemberRepository, FindOrganizationMemberByIdRepository } from '../repository';
import { CreateOrganizationMemberDto } from '../dto';
import { FindUserRepository } from 'src/modules/users/repository';
import { FindOrganizationByIdRepository } from 'src/modules/organization/repository';

@Injectable()
export class CreateOrganizationMemberUseCase {
    constructor(
        private readonly createOrganizationMemberRepository: CreateOrganizationMemberRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly findUserByIdRepository: FindUserRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateOrganizationMemberDto) {
        try {
            // Verificar se usuário existe
            const user = await this.findUserByIdRepository.findById(data.userId);
            if (!user) {
                this.logger.warn(`User with id ${data.userId} not found`, CreateOrganizationMemberUseCase.name);
                throw new NotFoundException('User not found');
            }

            // Verificar se organização existe
            const organization = await this.findOrganizationByIdRepository.findById(data.organizationId);
            if (!organization) {
                this.logger.warn(`Organization with id ${data.organizationId} not found`, CreateOrganizationMemberUseCase.name);
                throw new NotFoundException('Organization not found');
            }

            // Verificar se já é membro
            const existingMember = await this.findOrganizationMemberByIdRepository.findByUserAndOrganization(
                data.userId,
                data.organizationId,
            );
            if (existingMember) {
                this.logger.warn('User is already a member of this organization', CreateOrganizationMemberUseCase.name);
                throw new BadRequestException('User is already a member of this organization');
            }

            const member = await this.createOrganizationMemberRepository.create(data);
            this.logger.log(`Member added to organization: ${organization.name}`, CreateOrganizationMemberUseCase.name);
            return member;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error creating organization member',
                cause: err,
                description: 'Error creating organization member',
            });
            this.logger.error(error.message, err.stack, CreateOrganizationMemberUseCase.name);
            throw error;
        }
    }
}
