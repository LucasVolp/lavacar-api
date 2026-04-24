import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Status } from "prisma/generated";
import { UpdateOrganizationRepository } from "src/modules/organization/repository";
import { FindSubscriptionByIdRepository, UpdateSubscriptionRepository } from "../repository";
import { AsaasService } from "../services/asaas.service";

@Injectable()
export class CancelSubscriptionUseCase {
    private readonly logger = new Logger(CancelSubscriptionUseCase.name);

    constructor(
        private readonly findSubscriptionById: FindSubscriptionByIdRepository,
        private readonly updateSubscription: UpdateSubscriptionRepository,
        private readonly updateOrganization: UpdateOrganizationRepository,
        private readonly asaasService: AsaasService,
    ) {}

    async execute(subscriptionId: string) {
        const subscription = await this.findSubscriptionById.findById(subscriptionId);
        if (!subscription) throw new NotFoundException("Assinatura não encontrada");

        await this.asaasService.cancelSubscription(subscription.subscriptionId);
        
        await this.updateSubscription.update(subscription.id, {
            status: Status.CANCELLED,
            cancelledAt: new Date(),
            expiresAt: subscription.currentPeriodEnd,
        });

        this.logger.log(
            `Subscription ${subscription.id} cancelled manually (vigent until ${subscription.currentPeriodEnd}) — org ${subscription.organizationId} remains active`,
        );

        return { ...subscription, status: Status.CANCELLED };
    }
}
