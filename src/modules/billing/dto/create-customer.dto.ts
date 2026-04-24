import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { PaymentMethod } from "prisma/generated";

export class CreateBillingDto {

    @IsEnum(PaymentMethod)
    billingType: PaymentMethod;

    @IsString()
    @IsOptional()
    ownerName?: string;

    @IsString()
    @IsOptional()
    ownerDocument?: string;

    @IsEmail()
    @IsOptional()
    ownerEmail?: string;

    @IsPhoneNumber("BR")
    @IsOptional()
    ownerPhone?: string;
}
