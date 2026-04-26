import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InviteStatus } from 'prisma/generated';
import { FindUserByEmailRepository } from 'src/modules/users/repository';
import { hashToken } from 'src/shared/utils/secure-token.util';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { OrganizationInviteRepository } from '../repository/organization-invite.repository';

@Injectable()
export class GetInviteDetailsUseCase {
  constructor(
    private readonly organizationInviteRepository: OrganizationInviteRepository,
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
  ) {}

  async execute(dto: AcceptInviteDto) {
    const tokenHash = hashToken(dto.token);

    const invite = await this.organizationInviteRepository.findByTokenHash(tokenHash);

    if (!invite) {
      throw new UnauthorizedException('Convite inválido.');
    }

    if (invite.status === InviteStatus.REVOKED) {
      throw new UnauthorizedException('Este convite foi revogado.');
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new UnauthorizedException('Este convite já foi aceito.');
    }

    if (invite.status === InviteStatus.EXPIRED || invite.expiresAt.getTime() <= Date.now()) {
      if (invite.status !== InviteStatus.EXPIRED) {
        await this.organizationInviteRepository.markAsExpired(invite.id);
      }
      throw new UnauthorizedException('Convite expirado. Solicite um novo ao administrador.');
    }

    const existingUser = await this.findUserByEmailRepository.findUserByEmail(invite.email);

    return {
      userExists: !!existingUser,
      invite: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
        logoUrl: invite.organization.logoUrl,
      },
      invitedBy: {
        firstName: invite.invitedBy.firstName,
        lastName: invite.invitedBy.lastName,
      },
    };
  }
}
