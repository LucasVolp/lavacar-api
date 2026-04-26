import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/shared/decorators/public.decorator';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class CanAccessShopGuard implements CanActivate {
    private readonly logger = new Logger(CanAccessShopGuard.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const { user } = request;

        if (!user) return false;
        if (user.role === 'ADMIN') return true;

        // Shop endpoints use :id param; some nested contexts may use :shopId
        const shopId = request.params.shopId ?? request.params.id;
        if (!shopId) return true;

        try {
            const shop = await this.prisma.shop.findUnique({
                where: { id: shopId },
                select: {
                    id: true,
                    organizationId: true,
                    organization: { select: { ownerId: true } },
                },
            });

            if (!shop) return true; // Let controller handle 404

            // Organization owner always has access
            if (shop.organization.ownerId === user.id) return true;

            // OWNER role member of the organization
            const ownerMember = await this.prisma.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId: user.id,
                        organizationId: shop.organizationId,
                    },
                },
                select: { id: true, role: true },
            });

            if (ownerMember?.role === 'OWNER') return true;

            // Non-owners must be explicitly assigned as ShopManager
            if (ownerMember) {
                const shopManager = await this.prisma.shopManager.findUnique({
                    where: {
                        shopId_memberId: {
                            shopId: shop.id,
                            memberId: ownerMember.id,
                        },
                    },
                    select: { id: true },
                });

                if (shopManager) return true;
            }

            this.logger.warn(
                `User ${user.id} attempted to access shop ${shopId} without permission`,
            );
            throw new ForbiddenException('Você não tem acesso a este estabelecimento.');
        } catch (error) {
            if (error instanceof ForbiddenException) throw error;
            this.logger.error(`Error checking shop access for shop ${shopId}:`, error);
            throw new ForbiddenException('Erro ao verificar permissão de acesso ao estabelecimento.');
        }
    }
}
