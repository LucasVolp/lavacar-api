import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindSubscriptionByIdRepository, UpdateSubscriptionRepository } from "../repository";
import { AsaasService } from "../services/asaas.service";
import { Status } from "prisma/generated";

@Injectable()
export class FindSubscriptionByIdUseCase {
    private readonly logger = new Logger(FindSubscriptionByIdUseCase.name);

    constructor (
        private readonly findSubscription: FindSubscriptionByIdRepository,
        private readonly updateSubscription: UpdateSubscriptionRepository,
        private readonly asaasService: AsaasService
    ) {}

    private mapAsaasStatusToPrisma(asaasStatus: string): Status {
        const statusMap: Record<string, Status> = {
            'ACTIVE': Status.ACTIVE,
            'INACTIVE': Status.EXPIRED,
            'EXPIRED': Status.EXPIRED,
            'CANCELLED': Status.CANCELLED,
            'OVERDUE': Status.OVERDUE,
            'PENDING': Status.PENDING,
            'TRIAL': Status.ACTIVE
        };
        return statusMap[asaasStatus] || Status.PENDING;
    }

    async execute (id: string) {
        try {
            const subscription = await this.findSubscription.findById(id);

            if (!subscription) {
                throw new NotFoundException(`Subscription with id ${id} not found`);
            }

            try {
                const asaasSubscription = await this.asaasService.getSubscription(subscription.subscriptionId);
                const currentStatus = this.mapAsaasStatusToPrisma(asaasSubscription.status);

                if (currentStatus !== subscription.status) {
                    return await this.updateSubscription.update(id, {
                        status: currentStatus
                    });
                }
            } catch (syncError) {
                this.logger.warn(`Failed to sync subscription ${id} with Asaas: ${syncError.message}`);
            }

            return subscription;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            this.logger.error(`Error finding subscription ${id}: ${err.message}`);
            throw new ServiceUnavailableException("Something bad happened while fetching the subscription");
        }
    }
}
