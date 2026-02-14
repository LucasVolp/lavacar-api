import { ForbiddenException } from '@nestjs/common';
import { Role } from 'prisma/generated';
import { PrismaService } from '../databases/prisma.database';
import { JwtPayload } from '../types/jwt-payload.interface';

const SCOPED_ROLES = new Set<Role>([Role.OWNER, Role.EMPLOYEE, Role.MANAGER]);

export function isAdminRole(role: string): boolean {
  return role === Role.ADMIN;
}

export async function resolveAllowedShopIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const shops = await prisma.shop.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { organization: { ownerId: userId } },
        { managers: { some: { member: { userId } } } },
      ],
    },
    select: { id: true },
  });

  return shops.map((shop) => shop.id);
}

export async function buildShopScope(
  prisma: PrismaService,
  user: JwtPayload,
  requestedShopId?: string,
): Promise<Record<string, unknown>> {
  if (isAdminRole(user.role)) {
    return requestedShopId ? { shopId: requestedShopId } : {};
  }

  if (!SCOPED_ROLES.has(user.role as Role)) {
    throw new ForbiddenException('Role not allowed for internal shop-scoped resources');
  }

  const allowedShopIds = await resolveAllowedShopIds(prisma, user.id);

  if (requestedShopId) {
    if (!allowedShopIds.includes(requestedShopId)) {
      throw new ForbiddenException('You are not allowed to access this shop');
    }
    return { shopId: requestedShopId };
  }

  if (allowedShopIds.length === 0) {
    return { shopId: '__no_access__' };
  }

  return { shopId: { in: allowedShopIds } };
}
