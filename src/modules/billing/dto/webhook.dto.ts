import { IsObject, IsOptional, IsString, Allow } from "class-validator";
import { Type } from "class-transformer";

class WebhookPaymentDto {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: string;
    billingType: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    description?: string;
    dueDate?: string;
}

class WebhookSubscriptionDto {
    id: string;
    customer: string;
    status: string;
    billingType: string;
    value: number;
    cycle: string;
    nextDueDate?: string;
}

export class AsaasWebhookDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    event: string;

    @IsString()
    @IsOptional()
    dateCreated?: string;

    @Allow()
    @IsOptional()
    account?: unknown;

    @IsObject()
    @IsOptional()
    @Type(() => WebhookPaymentDto)
    payment?: WebhookPaymentDto;

    @IsObject()
    @IsOptional()
    @Type(() => WebhookSubscriptionDto)
    subscription?: WebhookSubscriptionDto;
}
