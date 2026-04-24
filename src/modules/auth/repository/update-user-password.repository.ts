import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class UpdateUserPasswordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true },
    });
  }
}
