import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InviteStatus, Role } from 'prisma/generated';
import { OrganizationInviteRepository } from '../repository/organization-invite.repository';

@Injectable()
export class RevokeInviteUseCase {
  private readonly logger = new Logger(RevokeInviteUseCase.name);

  constructor(
    private readonly organizationInviteRepository: OrganizationInviteRepository,
  ) {}

  async execute(currentUserId: string, organizationId: string, inviteId: string) {
    await this.assertCanManage(currentUserId, organizationId);

    const invite = await this.organizationInviteRepository.findById(inviteId);

    if (!invite || invite.organizationId !== organizationId) {
      throw new NotFoundException('Convite não encontrado.');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(
        'Só é possível revogar convites pendentes.',
      );
    }

    await this.organizationInviteRepository.markAsRevoked(inviteId);

    return { success: true, message: 'Convite revogado com sucesso.' };
  }

  private async assertCanManage(userId: string, organizationId: string): Promise<void> {
    const organization = await this.organizationInviteRepository.findOrganizationWithMemberContext(
      organizationId,
      userId,
    );

    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    if (!organization.isActive) {
      throw new ForbiddenException('Esta organização está inativa.');
    }

    const isOrgOwner = organization.ownerId === userId;
    const membership = organization.members[0];
    const isActiveManagerOrOwner = !!membership
      && membership.isActive
      && (membership.role === Role.OWNER || membership.role === Role.MANAGER);

    if (isOrgOwner || isActiveManagerOrOwner) return;

    this.logger.warn(
      `Revoke invite rejected: user ${userId} is not owner nor OWNER/MANAGER member of org ${organizationId}.`,
    );

    throw new ForbiddenException(
      'Apenas o dono ou gerentes da organização podem revogar convites.',
    );
  }
}
