import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { GoalPeriod } from 'prisma/generated';

export class CreateSalesGoalDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsNotEmpty()
    @Min(0)
    amount: number;

    @IsEnum(GoalPeriod)
    @IsNotEmpty()
    period: GoalPeriod;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsUUID()
    @IsOptional()
    shopId?: string;

    @IsUUID()
    @IsOptional()
    organizationId?: string;
}