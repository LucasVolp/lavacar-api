import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindUserByEmailRepository, FindUserRepository } from 'src/modules/users/repository';
import { MailService } from 'src/shared/mail/mail.service';
import { generateSecureToken } from 'src/shared/utils/secure-token.util';
import { RequestEmailChangeDto } from '../dto/request-email-change.dto';
import { EmailChangeRepository } from '../repository/email-change.repository';

const EXPIRATION_MINUTES = 60;

@Injectable()
export class RequestEmailChangeUseCase {
  constructor(
    private readonly findUserRepository: FindUserRepository,
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
    private readonly emailChangeRepository: EmailChangeRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(userId: string, dto: RequestEmailChangeDto): Promise<{ success: true }> {
    const user = await this.findUserRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.isActive) {
      throw new BadRequestException('Conta desativada.');
    }

    const normalized = dto.newEmail.trim().toLowerCase();

    if (user.email && user.email.toLowerCase() === normalized) {
      throw new BadRequestException('O novo e-mail deve ser diferente do atual.');
    }

    const existing = await this.findUserByEmailRepository.findUserByEmail(normalized);
    if (existing) {
      throw new ConflictException('Este e-mail já está em uso por outra conta.');
    }

    await this.emailChangeRepository.invalidateAllForUser(user.id);

    const { rawToken, tokenHash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

    await this.emailChangeRepository.create({
      userId: user.id,
      newEmail: normalized,
      tokenHash,
      expiresAt,
    });

    await this.mailService.sendEmailChangeConfirmation({
      to: normalized,
      firstName: user.firstName,
      token: rawToken,
      newEmail: normalized,
      expiresInMinutes: EXPIRATION_MINUTES,
    });

    return { success: true };
  }
}
