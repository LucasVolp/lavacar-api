import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesGoalDto } from './create-sales-goal.dto';
import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { GoalPeriod } from 'prisma/generated';

export class UpdateSalesGoalDto extends PartialType(CreateSalesGoalDto) {
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Min(0)
    amount?: number;

    @IsEnum(GoalPeriod)
    @IsOptional()
    period?: GoalPeriod;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}