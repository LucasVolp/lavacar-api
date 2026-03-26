import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindOrganizationByIdRepository, UpdateOrganizationRepository } from "src/modules/organization/repository";
import { CreateBillingDto } from "../dto/create-customer.dto";
import { PaymentMethod, Status } from "prisma/generated";
import { CreateSubscriptionRepository, FindSubscriptionByOrganizationRepository, UpdateSubscriptionRepository } from "../repository";
import { CreateAsaasSubscriptionDto } from "../dto/create-subscription.dto";
import { AsaasService } from "../services/asaas.service";

@Injectable()
export class CreateCheckoutUseCase {
    private readonly logger = new Logger(CreateCheckoutUseCase.name);

    constructor (
        private readonly findOrganization: FindOrganizationByIdRepository,
        private readonly updateOrganization: UpdateOrganizationRepository,
        private readonly findSubscription: FindSubscriptionByOrganizationRepository,
        private readonly createSubscription: CreateSubscriptionRepository,
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

    async execute (organizationId: string, data: CreateBillingDto, dataAsaas: CreateAsaasSubscriptionDto) {
        try {
            const organization = await this.findOrganization.findById(organizationId);
            if (!organization) {
                throw new NotFoundException(`Organization with id ${organizationId} not found`);
            }

            let customerId = organization.customerId;

            if (!customerId) {
                if (!data.ownerDocument || !data.ownerEmail || !data.ownerPhone) {
                    throw new BadRequestException("Owner document, email and phone are required to create a billing customer");
                }

                const customerIdempotencyKey = `cust_${organizationId}`;
                const customerResponse = await this.asaasService.createCustomer({
                    name: data.ownerName ?? organization.name ?? undefined,
                    cpfCnpj: data.ownerDocument ?? undefined,
                    email: data.ownerEmail ?? undefined,
                    mobilePhone: data.ownerPhone ?? undefined,
                }, customerIdempotencyKey);

                customerId = customerResponse.id;

                await this.updateOrganization.update(organizationId, {
                    customerId: customerId ?? undefined
                });
            }

            const subscriptionExists = await this.findSubscription.findByOrganizationId(organizationId);

            if (subscriptionExists) {
                if (subscriptionExists.status === Status.ACTIVE) {
                    throw new ConflictException(`Organization already has an active subscription`);
                } 
                
                if (subscriptionExists.status === Status.PENDING || subscriptionExists.status === Status.OVERDUE) {
                    if (subscriptionExists.billingType !== data.billingType) {
                        const updateIdempotencyKey = `upd_sub_${subscriptionExists.id}_${data.billingType}`;
                        await this.asaasService.updateSubscriptionBillingType(subscriptionExists.subscriptionId, data.billingType, updateIdempotencyKey);
                        await this.updateSubscription.update(subscriptionExists.id, {
                            billingType: data.billingType
                        });
                    }

                    const payments = await this.asaasService.getSubscriptionPayments(subscriptionExists.subscriptionId);
                    
                    if (!payments.data || payments.data.length === 0) {
                        throw new ServiceUnavailableException("No payments found for the existing subscription");
                    }

                    const lastPayment = payments.data[0];

                    if (data.billingType === PaymentMethod.CREDIT_CARD) {
                        return { checkoutUrl: lastPayment.invoiceUrl };
                    }

                    if (data.billingType === PaymentMethod.PIX) {
                        const pixData = await this.asaasService.getPixQrCode(lastPayment.id);
                        return {
                            encodedImage: pixData.encodedImage,
                            payload: pixData.payload,
                            expirationDate: pixData.expirationDate,
                            description: lastPayment.description,
                        };
                    }
                }
            }

            const subIdempotencyKey = `sub_${organizationId}`;
            const createSubscriptionResponse = await this.asaasService.createSubscription({
                customer: customerId!,
                billingType: dataAsaas.billingType || data.billingType,
                cycle: dataAsaas.cycle,
                value: dataAsaas.value,
            }, subIdempotencyKey);

            await this.createSubscription.create({
                organizationId: organizationId,
                subscriptionId: createSubscriptionResponse.id,
                status: this.mapAsaasStatusToPrisma(createSubscriptionResponse.status),
                plan: createSubscriptionResponse.description || "Subscription Plan",
                billingType: createSubscriptionResponse.billingType as PaymentMethod,
                price: createSubscriptionResponse.value,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(createSubscriptionResponse.nextDueDate),
                nextDueDate: new Date(createSubscriptionResponse.nextDueDate)
            });

            const paymentsResponse = await this.asaasService.getSubscriptionPayments(createSubscriptionResponse.id);
            
            if (!paymentsResponse.data || paymentsResponse.data.length === 0) {
                return { id: createSubscriptionResponse.id, status: createSubscriptionResponse.status };
            }

            const firstPayment = paymentsResponse.data[0];

            if (createSubscriptionResponse.billingType === "CREDIT_CARD") {
                return { checkoutUrl: firstPayment.invoiceUrl };
            }

            if (createSubscriptionResponse.billingType === "PIX") {
                const pixData = await this.asaasService.getPixQrCode(firstPayment.id);
                return {
                    encodedImage: pixData.encodedImage,
                    payload: pixData.payload,
                    expirationDate: pixData.expirationDate,
                    description: firstPayment.description,
                };
            }

            return { id: createSubscriptionResponse.id, status: createSubscriptionResponse.status };
        }
        catch (err) {
            if (err instanceof NotFoundException || err instanceof ConflictException || err instanceof ServiceUnavailableException || err instanceof BadRequestException) {
                throw err;
            }

            this.logger.error(`Error in CreateCheckoutUseCase: ${err.message}`);
            throw new ServiceUnavailableException("Something bad happened while processing your request");
        }
    }
}
