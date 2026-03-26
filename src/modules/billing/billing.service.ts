import { Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-customer.dto';
import { CreateAsaasSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentMethod } from 'prisma/generated';
import { 
  CreateCheckoutUseCase, 
  FindAllSubscriptionsUseCase, 
  FindSubscriptionByIdUseCase, 
  UpdateSubscriptionUseCase 
} from './use-cases';

@Injectable()
export class BillingService {
  constructor(
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
    private readonly findSubscriptionByIdUseCase: FindSubscriptionByIdUseCase,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
  ) {}

  createCheckout(organizationId: string, billing: CreateBillingDto, asaas: CreateAsaasSubscriptionDto) {
    return this.createCheckoutUseCase.execute(organizationId, billing, asaas);
  }

  findAll(organizationId?: string, page?: number, limit?: number) {
    return this.findAllSubscriptionsUseCase.execute(organizationId, page, limit);
  }

  findById(id: string) {
    return this.findSubscriptionByIdUseCase.execute(id);
  }

  updateSubscription(id: string, billingType: PaymentMethod) {
    return this.updateSubscriptionUseCase.execute(id, billingType);
  }
}
