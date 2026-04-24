import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { PaymentMethod, Status } from "prisma/generated";

export class CreateAsaasSubscriptionDto {
    @IsString()
    @IsOptional()
    customerId?: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;

    @IsEnum(["MONTHLY", "ANNUALLY"])
    @IsNotEmpty()
    cycle: "MONTHLY" | "ANNUALLY";

    @IsEnum(PaymentMethod)
    @IsOptional()
    billingType?: PaymentMethod;

}

export class CreateSubscriptionDto {
    @IsUUID()
    organizationId: string;

    @IsString()
    subscriptionId: string;

    @IsEnum(Status)
    status: Status;

    @IsString()
    plan: string;

    @IsEnum(PaymentMethod)
    billingType: PaymentMethod;

    @IsNumber()
    price: number;

    @IsDate()
    currentPeriodStart: Date;
    
    @IsDate()
    currentPeriodEnd: Date;

    @IsDate()
    @IsOptional()
    nextDueDate?: Date;
}