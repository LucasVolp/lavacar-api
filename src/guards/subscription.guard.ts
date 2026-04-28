import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/shared/decorators/public.decorator';
import { PrismaService } from 'src/shared/databases/prisma.database';

const TRIAL_DAYS = 15;

@Injectable()
export class SubscriptionGuard implements CanActivate {
    private readonly logger = new Logger(SubscriptionGuard.name);

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

        const organizationId = await this.resolveOrganizationId(request);

        if (!organizationId) return true;

        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                createdAt: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        status: true,
                        expiresAt: true,
                    },
                },
            },
        });

        if (!organization) {
            throw new HttpException('ORGANIZATION_NOT_FOUND', HttpStatus.PAYMENT_REQUIRED);
        }

        const now = new Date();
        const subscription = organization.subscriptions[0];

        if (subscription) {
            const isActive = subscription.status === 'ACTIVE';
            const isCancelledButVigent =
                subscription.status === 'CANCELLED' &&
                !!(subscription.expiresAt && subscription.expiresAt > now);

            if (isActive || isCancelledButVigent) return true;
        }

        const trialEndsAt = new Date(organization.createdAt);
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

        if (now < trialEndsAt) return true;

        this.logger.warn(`Trial expired for organization ${organizationId}`);
        throw new HttpException('TRIAL_EXPIRED', HttpStatus.PAYMENT_REQUIRED);
    }

    private async resolveOrganizationId(request: {
        params?: Record<string, string>;
        query?: Record<string, string>;
    }): Promise<string | null> {
        const params = request.params ?? {};
        const query = request.query ?? {};

        if (params.organizationId) return params.organizationId;

        if (query.organizationId) return query.organizationId;

        if (params.shopId) return this.getOrgIdByShopId(params.shopId);
        if (query.shopId) return this.getOrgIdByShopId(query.shopId);

        return null;
    }

    private async getOrgIdByShopId(shopId: string): Promise<string | null> {
        if (!shopId) return null;
        try {
            const shop = await this.prisma.shop.findUnique({
                where: { id: shopId },
                select: { organizationId: true },
            });
            return shop?.organizationId ?? null;
        } catch {
            return null;
        }
    }
}
