import { Injectable, Logger } from '@nestjs/common';
import { FindUserByEmailRepository } from 'src/modules/users/repository';
import { MailService } from 'src/shared/mail/mail.service';
import { generateSecureToken } from 'src/shared/utils/secure-token.util';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { PasswordResetRepository } from '../repository/password-reset.repository';

const EXPIRATION_MINUTES = 60;

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(dto: RequestPasswordResetDto): Promise<{ success: true }> {
    const user = await this.findUserByEmailRepository.findUserByEmail(dto.email);

    if (!user || !user.isActive || !user.email) {
      this.logger.warn(`Password reset requested for unknown/inactive email: ${dto.email}`);
      return { success: true };
    }

    await this.passwordResetRepository.invalidateAllForUser(user.id);

    const { rawToken, tokenHash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

    await this.passwordResetRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      token: rawToken,
      expiresInMinutes: EXPIRATION_MINUTES,
    });

    return { success: true };
  }
}
