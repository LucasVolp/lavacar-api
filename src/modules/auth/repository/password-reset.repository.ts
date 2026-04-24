import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

interface CreatePasswordResetInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePasswordResetInput) {
    return this.prisma.passwordReset.create({ data });
  }

  async findValidByHash(tokenHash: string) {
    return this.prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, isActive: true },
        },
      },
    });
  }

  async markAsUsed(id: string) {
    return this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string) {
    return this.prisma.passwordReset.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
