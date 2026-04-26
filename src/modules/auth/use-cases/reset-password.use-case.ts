import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { hashToken } from 'src/shared/utils/secure-token.util';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PasswordResetRepository } from '../repository/password-reset.repository';
import { UpdateUserPasswordRepository } from '../repository/update-user-password.repository';

const SALT_ROUNDS = 10;

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly updateUserPasswordRepository: UpdateUserPasswordRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ success: true }> {
    const tokenHash = hashToken(dto.token);

    const reset = await this.passwordResetRepository.findValidByHash(tokenHash);

    if (!reset) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    if (!reset.user.isActive) {
      throw new BadRequestException('Conta desativada.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.updateUserPasswordRepository.updatePassword(reset.user.id, hashedPassword);
    await this.passwordResetRepository.markAsUsed(reset.id);
    await this.passwordResetRepository.invalidateAllForUser(reset.user.id);

    return { success: true };
  }
}
