import { CanActivate, ExecutionContext, ForbiddenException, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Status } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { IS_PUBLIC_KEY } from "src/shared/decorators/public.decorator";
import { Reflector } from "@nestjs/core";

const TRIAL_DAYS = 15;

@Injectable()
export class CanAccessOrganizationWithBillingGuard implements CanActivate {
    private readonly logger = new Logger(CanAccessOrganizationWithBillingGuard.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;
        const organizationId = request.params.organizationId ?? request.params.id;

        if (user?.role === "ADMIN") {
            return true;
        }

        if (!organizationId) {
            return true;
        }

        try {
            const organization = await this.prisma.organization.findUnique({
                where: { id: organizationId },
                include: {
                    subscriptions: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            });

            if (!organization) {
                this.logger.warn(`Organization ${organizationId} not found`);
                throw new ForbiddenException("Organização não encontrada");
            }

            // Verify the requesting user is the org owner or an active member
            const isOwner = organization.ownerId === user.id;
            if (!isOwner) {
                const membership = await this.prisma.organizationMember.findUnique({
                    where: {
                        userId_organizationId: { userId: user.id, organizationId },
                    },
                    select: { id: true, isActive: true },
                });
                if (!membership?.isActive) {
                    throw new ForbiddenException("Você não tem acesso a esta organização.");
                }
            }

            if (!organization.isActive) {
                this.logger.warn(`Organization ${organizationId} is inactive`);
                throw new ForbiddenException("Organização inativa");
            }

            const now = new Date();

            if (!organization.subscriptions || organization.subscriptions.length === 0) {
                const trialEndsAt = new Date(organization.createdAt);
                trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

                if (now < trialEndsAt) return true;

                this.logger.warn(`Trial expired for organization ${organizationId}`);
                throw new HttpException('TRIAL_EXPIRED', HttpStatus.PAYMENT_REQUIRED);
            }

            const subscription = organization.subscriptions[0];

            if (subscription.expiresAt && subscription.expiresAt <= now) {
                this.logger.warn(
                    `Organization ${organizationId} subscription expired at ${subscription.expiresAt}`,
                );
                throw new HttpException('SUBSCRIPTION_EXPIRED', HttpStatus.PAYMENT_REQUIRED);
            }

            const isValidStatus =
                subscription.status === Status.ACTIVE ||
                (subscription.status === Status.CANCELLED &&
                    subscription.expiresAt &&
                    subscription.expiresAt > now);

            if (!isValidStatus) {
                this.logger.warn(
                    `Organization ${organizationId} has invalid subscription status: ${subscription.status}`,
                );

                const statusMessages: Record<string, string> = {
                    [Status.PENDING]: 'SUBSCRIPTION_PENDING',
                    [Status.OVERDUE]: 'SUBSCRIPTION_OVERDUE',
                    [Status.EXPIRED]: 'SUBSCRIPTION_EXPIRED',
                    [Status.CANCELLED]: 'SUBSCRIPTION_CANCELLED',
                };

                throw new HttpException(
                    statusMessages[subscription.status as string] ?? 'SUBSCRIPTION_INVALID',
                    HttpStatus.PAYMENT_REQUIRED,
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Error checking billing access for org ${organizationId}:`, error);
            throw new ForbiddenException("Erro ao verificar permissão de acesso");
        }
    }
}
