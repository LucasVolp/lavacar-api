import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role } from 'prisma/generated';
import { OrganizationInviteRepository } from '../repository/organization-invite.repository';

@Injectable()
export class ListInvitesUseCase {
  private readonly logger = new Logger(ListInvitesUseCase.name);

  constructor(
    private readonly organizationInviteRepository: OrganizationInviteRepository,
  ) {}

  async execute(currentUserId: string, organizationId: string) {
    await this.assertCanManage(currentUserId, organizationId);

    await this.organizationInviteRepository.markStalePendingAsExpired(organizationId);

    return this.organizationInviteRepository.findByOrganization(organizationId);
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
      `List invites rejected: user ${userId} is not owner nor OWNER/MANAGER member of org ${organizationId}.`,
    );

    throw new ForbiddenException(
      'Apenas o dono ou gerentes da organização podem listar os convites.',
    );
  }
}
