import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'prisma/generated';
import { FindUserRepository } from 'src/modules/users/repository';
import { MailService } from 'src/shared/mail/mail.service';
import { generateSecureToken } from 'src/shared/utils/secure-token.util';
import { SendInviteDto } from '../dto/send-invite.dto';
import { OrganizationInviteRepository } from '../repository/organization-invite.repository';

const EXPIRATION_HOURS = 48;

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Gerente',
  EMPLOYEE: 'Funcionário',
};

@Injectable()
export class SendInviteUseCase {
  private readonly logger = new Logger(SendInviteUseCase.name);

  constructor(
    private readonly organizationInviteRepository: OrganizationInviteRepository,
    private readonly findUserRepository: FindUserRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(currentUserId: string, dto: SendInviteDto) {
    await this.assertCanInvite(currentUserId, dto.organizationId);

    const organization = await this.organizationInviteRepository.findOrganizationWithMemberContext(
      dto.organizationId,
      currentUserId,
    );

    const inviter = await this.findUserRepository.findById(currentUserId);
    if (!inviter) {
      throw new NotFoundException('Usuário convidante não encontrado.');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const alreadyMember = await this.organizationInviteRepository.countMembersWithEmail(
      normalizedEmail,
      organization!.id,
    );
    if (alreadyMember > 0) {
      throw new ConflictException('Este e-mail já faz parte desta organização.');
    }

    const pending = await this.organizationInviteRepository.findPendingByEmailAndOrganization(
      normalizedEmail,
      organization!.id,
    );
    if (pending) {
      throw new ConflictException(
        'Já existe um convite pendente para este e-mail nesta organização.',
      );
    }

    const { rawToken, tokenHash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000);

    const invite = await this.organizationInviteRepository.create({
      email: normalizedEmail,
      role: dto.role,
      tokenHash,
      organizationId: organization!.id,
      shopId: dto.shopId,
      invitedById: currentUserId,
      expiresAt,
    });

    const invitedByName = [inviter.firstName, inviter.lastName].filter(Boolean).join(' ').trim();

    await this.mailService.sendOrganizationInvite({
      to: normalizedEmail,
      token: rawToken,
      organizationName: organization!.name,
      invitedByName: invitedByName || 'Equipe NexoCar',
      roleLabel: ROLE_LABELS[dto.role] ?? 'Membro',
      expiresInHours: EXPIRATION_HOURS,
    });

    this.logger.log(
      `Invite sent to ${normalizedEmail} for org ${organization!.id} by user ${currentUserId}`,
    );

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      organizationId: invite.organizationId,
    };
  }

  private async assertCanInvite(userId: string, organizationId: string): Promise<void> {
    const organization = await this.organizationInviteRepository.findOrganizationWithMemberContext(
      organizationId,
      userId,
    );

    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    if (!organization.isActive) {
      throw new ForbiddenException(
        'Esta organização está inativa. Regularize a assinatura para convidar membros.',
      );
    }

    const isOrgOwner = organization.ownerId === userId;
    const membership = organization.members?.[0];
    const membershipRole = String(membership?.role || '');
    const isActiveManagerOrOwner = !!membership
      && membership.isActive
      && (membershipRole === 'OWNER' || membershipRole === 'MANAGER');

    if (isOrgOwner || isActiveManagerOrOwner) return;

    throw new ForbiddenException(
      'Você não tem permissão para realizar convites nesta organização. ' +
      'Apenas o dono ou gerentes podem realizar esta ação.'
    );
  }
}
