import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class UpdateUserEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateEmail(userId: string, newEmail: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { email: newEmail },
        select: { id: true, email: true },
      });
    } catch (err) {
      const error = err as { code?: string };
      if (error.code === 'P2002') {
        throw new ConflictException('Este e-mail já está em uso por outra conta.');
      }
      throw err;
    }
  }
}
