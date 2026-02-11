import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../databases/prisma.database';

@Injectable()
export class OwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async isShopOwner(userId: string, shopId: string): Promise<boolean> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        ownerId: true,
        organization: { select: { ownerId: true } },
      },
    });

    if (!shop) return false;

    return shop.ownerId === userId || shop.organization.ownerId === userId;
  }

  async isShopManager(userId: string, shopId: string): Promise<boolean> {
    const manager = await this.prisma.shopManager.findFirst({
      where: {
        shopId,
        member: { userId, isActive: true },
      },
    });

    return !!manager;
  }

  async assertShopAccess(userId: string, role: string, shopId: string): Promise<void> {
    if (role === 'ADMIN') return;

    const isOwner = await this.isShopOwner(userId, shopId);
    if (isOwner) return;

    const isManager = await this.isShopManager(userId, shopId);
    if (isManager) return;

    throw new ForbiddenException('You do not have access to this shop');
  }
}
