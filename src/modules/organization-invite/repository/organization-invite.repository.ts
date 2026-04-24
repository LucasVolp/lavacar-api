import { Injectable } from '@nestjs/common';
import { InviteStatus, Role } from 'prisma/generated';
import { PrismaService } from 'src/shared/databases/prisma.database';

interface CreateInviteInput {
  email: string;
  role: Role;
  tokenHash: string;
  organizationId: string;
  shopId?: string;
  invitedById: string;
  expiresAt: Date;
}

@Injectable()
export class OrganizationInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInviteInput) {
    return this.prisma.organizationInvite.create({ data });
  }

  async findPendingByEmailAndOrganization(email: string, organizationId: string) {
    return this.prisma.organizationInvite.findFirst({
      where: {
        email,
        organizationId,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.prisma.organizationInvite.findUnique({
      where: { tokenHash },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        invitedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organizationInvite.findUnique({
      where: { id },
      select: { id: true, organizationId: true, status: true, email: true },
    });
  }

  async markAsExpired(id: string) {
    return this.prisma.organizationInvite.update({
      where: { id },
      data: { status: InviteStatus.EXPIRED },
    });
  }

  async markAsRevoked(id: string) {
    return this.prisma.organizationInvite.update({
      where: { id },
      data: { status: InviteStatus.REVOKED, revokedAt: new Date() },
    });
  }

  async findValidOrganizationForOwner(organizationId: string, ownerId: string) {
    return this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        isActive: true,
        OR: [
          { ownerId: ownerId },
          {
            members: {
              some: {
                userId: ownerId,
                role: { in: [Role.OWNER, Role.MANAGER] },
                isActive: true,
              },
            },
          },
        ],
      },
      select: { id: true, name: true, ownerId: true },
    });
  }

  async findOrganizationWithMemberContext(organizationId: string, userId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        isActive: true,
        members: {
          where: { userId },
          select: { id: true, role: true, isActive: true },
          take: 1,
        },
      },
    });
  }

  async countMembersWithEmail(email: string, organizationId: string) {
    return this.prisma.organizationMember.count({
      where: {
        organizationId,
        user: { email },
      },
    });
  }

  async findByOrganization(
    organizationId: string,
    filters: { status?: InviteStatus } = {},
  ) {
    return this.prisma.organizationInvite.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
        invitedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markStalePendingAsExpired(organizationId: string) {
    return this.prisma.organizationInvite.updateMany({
      where: {
        organizationId,
        status: InviteStatus.PENDING,
        expiresAt: { lte: new Date() },
      },
      data: { status: InviteStatus.EXPIRED },
    });
  }

  async acceptInviteTransactional(input: {
    inviteId: string;
    userId: string;
    organizationId: string;
    shopId?: string | null;
    role: Role;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
      });

      const member = existingMember
        ? await tx.organizationMember.update({
            where: { id: existingMember.id },
            data: { role: input.role, isActive: true },
          })
        : await tx.organizationMember.create({
            data: {
              userId: input.userId,
              organizationId: input.organizationId,
              role: input.role,
              isActive: true,
            },
          });

      // Se o convite tem um shopId, adiciona o membro como ShopManager
      if (input.shopId) {
        await tx.shopManager.upsert({
          where: {
            shopId_memberId: {
              shopId: input.shopId,
              memberId: member.id,
            },
          },
          create: {
            shopId: input.shopId,
            memberId: member.id,
          },
          update: {}, // Já é gerente deste shop, nada a fazer
        });
      }

      const invite = await tx.organizationInvite.update({
        where: { id: input.inviteId },
        data: { status: InviteStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return { member, invite };
    });
  }
}
