import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InviteStatus, Role } from 'prisma/generated';
import { FindUserByEmailRepository, CreateUserRepository, UpdateUserRepository } from 'src/modules/users/repository';
import { hashToken } from 'src/shared/utils/secure-token.util';
import * as bcrypt from 'bcrypt';
import { Role as UserRole } from 'src/modules/users/types/Role';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { OrganizationInviteRepository } from '../repository/organization-invite.repository';

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    private readonly organizationInviteRepository: OrganizationInviteRepository,
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
    private readonly createUserRepository: CreateUserRepository,
    private readonly updateUserRepository: UpdateUserRepository,
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

    let user = await this.findUserByEmailRepository.findUserByEmail(invite.email);

    if (!user) {
      if (!dto.firstName || !dto.lastName || !dto.password) {
        throw new BadRequestException('Por favor, informe seu nome, sobrenome e senha para criar a conta.');
      }
      
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      user = await this.createUserRepository.create({
        email: invite.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
        phone: `invite-${Date.now()}`,
        role: (invite.role || Role.USER) as unknown as UserRole,
      });
    }

    const { member } = await this.organizationInviteRepository.acceptInviteTransactional({
      inviteId: invite.id,
      userId: user.id,
      organizationId: invite.organization.id,
      shopId: invite.shopId,
      role: invite.role,
    });

    // Upgrade the user's global role so the JWT allows access to org routes
    // Only upgrade USER → invite role; never downgrade OWNER/ADMIN
    if (user.role === Role.USER && invite.role && invite.role !== Role.USER) {
      await this.updateUserRepository.update(user.id, { role: invite.role as unknown as UserRole });
    }

    return {
      success: true as const,
      member: {
        id: member.id,
        role: member.role,
        organizationId: member.organizationId,
      },
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
        slug: invite.organization.slug,
      },
    };
  }
}
