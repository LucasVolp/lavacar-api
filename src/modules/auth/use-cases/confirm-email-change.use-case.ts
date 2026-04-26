import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashToken } from 'src/shared/utils/secure-token.util';
import { ConfirmEmailChangeDto } from '../dto/confirm-email-change.dto';
import { EmailChangeRepository } from '../repository/email-change.repository';
import { UpdateUserEmailRepository } from '../repository/update-user-email.repository';

@Injectable()
export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly emailChangeRepository: EmailChangeRepository,
    private readonly updateUserEmailRepository: UpdateUserEmailRepository,
  ) {}

  async execute(dto: ConfirmEmailChangeDto): Promise<{ success: true; email: string }> {
    const tokenHash = hashToken(dto.token);

    const change = await this.emailChangeRepository.findValidByHash(tokenHash);

    if (!change) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const updated = await this.updateUserEmailRepository.updateEmail(
      change.userId,
      change.newEmail,
    );

    await this.emailChangeRepository.markAsUsed(change.id);
    await this.emailChangeRepository.invalidateAllForUser(change.userId);

    return { success: true, email: updated.email! };
  }
}
