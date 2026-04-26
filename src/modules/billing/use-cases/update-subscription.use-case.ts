import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { AsaasService } from "../services/asaas.service";
import { FindSubscriptionByIdRepository, UpdateSubscriptionRepository } from "../repository";
import { PaymentMethod, Status } from "prisma/generated";

@Injectable()
export class UpdateSubscriptionUseCase {
    private readonly logger = new Logger(UpdateSubscriptionUseCase.name);

    constructor (
        private readonly asaasService: AsaasService,
        private readonly findSubscription: FindSubscriptionByIdRepository,
        private readonly updateSubscription: UpdateSubscriptionRepository
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

    async execute (subscriptionId: string, billingType: PaymentMethod) {
        try {
            const subscriptionExists = await this.findSubscription.findById(subscriptionId);
            
            if (!subscriptionExists) {
                throw new NotFoundException(`Subscription with id ${subscriptionId} not found`);
            }

            if (subscriptionExists.billingType === billingType) {
                throw new ConflictException("The provided billing type is already the current one");
            }

            if (!Object.values(PaymentMethod).includes(billingType)) {
                throw new BadRequestException("Invalid billing type provided");
            }

            const idempotencyKey = `upd_sub_direct_${subscriptionId}_${billingType}`;
            const asaasResponse = await this.asaasService.updateSubscriptionBillingType(
                subscriptionExists.subscriptionId, 
                billingType,
                idempotencyKey
            );

            const updatedSubscription = await this.updateSubscription.update(subscriptionId, {
                billingType: billingType,
                status: this.mapAsaasStatusToPrisma(asaasResponse.status)
            });

            return updatedSubscription;
        } catch (err) {
            if (
                err instanceof NotFoundException || 
                err instanceof BadRequestException || 
                err instanceof ConflictException ||
                err instanceof ServiceUnavailableException
            ) {
                throw err;
            }

            this.logger.error(`Error updating subscription ${subscriptionId}: ${err.message}`);
            throw new ServiceUnavailableException("Something bad happened while updating the subscription");
        }
    }
}
