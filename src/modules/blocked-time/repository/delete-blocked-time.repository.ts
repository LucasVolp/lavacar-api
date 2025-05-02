import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class DeleteBlockedTimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: string) {
    return await this.prisma.blockedTime.delete({
      where: { id },
      include: { shop: true },
    });
  }
}
