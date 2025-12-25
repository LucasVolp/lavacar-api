import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateOrganizationMemberRepository, FindOrganizationMemberByIdRepository } from '../repository';
import { UpdateOrganizationMemberDto } from '../dto';

@Injectable()
export class UpdateOrganizationMemberUseCase {
    constructor(
        private readonly updateOrganizationMemberRepository: UpdateOrganizationMemberRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateOrganizationMemberDto) {
        try {
            const member = await this.findOrganizationMemberByIdRepository.findById(id);

            if (!member) {
                this.logger.warn(`Organization member with id ${id} not found`, UpdateOrganizationMemberUseCase.name);
                throw new NotFoundException('Organization member not found!');
            }

            const updatedMember = await this.updateOrganizationMemberRepository.update(id, data);
            this.logger.log('Organization member updated!', UpdateOrganizationMemberUseCase.name);
            return updatedMember;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error updating organization member',
                cause: err,
                description: 'Error updating organization member',
            });
            this.logger.error(error.message, err.stack, UpdateOrganizationMemberUseCase.name);
            throw error;
        }
    }
}
