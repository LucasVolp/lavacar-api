import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { PaymentMethod } from "prisma/generated";

export class CreateSelfCheckoutDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    orgName: string;

    @IsString()
    @MinLength(11)
    @MaxLength(18)
    document: string;

    @IsEnum(PaymentMethod)
    billingType: PaymentMethod;

    @IsEnum(["MONTHLY", "ANNUALLY"])
    @IsNotEmpty()
    cycle: "MONTHLY" | "ANNUALLY";
}
