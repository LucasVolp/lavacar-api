import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Status } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { IS_PUBLIC_KEY } from "src/shared/decorators/public.decorator";
import { Reflector } from "@nestjs/core";

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

            if (!organization.subscriptions || organization.subscriptions.length === 0) {
                this.logger.warn(`Organization ${organizationId} has no active subscription`);
                throw new ForbiddenException("Nenhuma assinatura ativa");
            }

            const subscription = organization.subscriptions[0];
            const now = new Date();

            if (subscription.expiresAt && subscription.expiresAt <= now) {
                this.logger.warn(
                    `Organization ${organizationId} subscription expired at ${subscription.expiresAt}`,
                );
                throw new ForbiddenException(
                    "Sua assinatura expirou. Por favor, renove para continuar utilizando o sistema.",
                );
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
                    [Status.PENDING]:
                        "Sua assinatura está pendente de confirmação. Aguarde o processamento do pagamento.",
                    [Status.OVERDUE]: "Sua assinatura está inadimplente. Por favor, realize o pagamento para continuar.",
                    [Status.EXPIRED]: "Sua assinatura expirou. Por favor, renove para continuar utilizando o sistema.",
                    [Status.CANCELLED]:
                        "Sua assinatura foi cancelada e não está mais vigente. Por favor, contrate um novo plano.",
                };

                throw new ForbiddenException(statusMessages[subscription.status as string] || "Status de assinatura inválido");
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(`Error checking billing access for org ${organizationId}:`, error);
            throw new ForbiddenException("Erro ao verificar permissão de acesso");
        }
    }
}
