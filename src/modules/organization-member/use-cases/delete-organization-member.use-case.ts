import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { DeleteOrganizationMemberRepository, FindOrganizationMemberByIdRepository } from '../repository';

@Injectable()
export class DeleteOrganizationMemberUseCase {
    constructor(
        private readonly deleteOrganizationMemberRepository: DeleteOrganizationMemberRepository,
        private readonly findOrganizationMemberByIdRepository: FindOrganizationMemberByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, currentUserId: string) {
        try {
            const member = await this.findOrganizationMemberByIdRepository.findById(id);

            if (!member) {
                this.logger.warn(`Organization member with id ${id} not found`, DeleteOrganizationMemberUseCase.name);
                throw new NotFoundException('Organization member not found!');
            }

            if (member.userId === currentUserId) {
                this.logger.warn(
                    `User ${currentUserId} attempted to delete own organization membership`,
                    DeleteOrganizationMemberUseCase.name,
                );
                throw new ForbiddenException('You cannot remove yourself from the organization');
            }

            const deleted = await this.deleteOrganizationMemberRepository.delete(id);
            this.logger.log('Organization member deleted!', DeleteOrganizationMemberUseCase.name);
            return deleted;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof ForbiddenException) {
                throw err;
            }
            const error = new ServiceUnavailableException({
                message: 'Error deleting organization member',
                cause: err,
                description: 'Error deleting organization member',
            });
            this.logger.error(error.message, err.stack, DeleteOrganizationMemberUseCase.name);
            throw error;
        }
    }
}
