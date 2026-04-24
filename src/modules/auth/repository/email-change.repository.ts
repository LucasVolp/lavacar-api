import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

interface CreateEmailChangeInput {
  userId: string;
  newEmail: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class EmailChangeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEmailChangeInput) {
    return this.prisma.emailChange.create({ data });
  }

  async findValidByHash(tokenHash: string) {
    return this.prisma.emailChange.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markAsUsed(id: string) {
    return this.prisma.emailChange.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string) {
    return this.prisma.emailChange.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
