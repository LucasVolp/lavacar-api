import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    price?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsUUID()
    @IsOptional()
    groupId?: string;

    @IsString()
    @IsOptional()
    photoUrl?: string;

    @IsBoolean()
    @IsOptional()
    isBudgetOnly?: boolean;

    @IsBoolean()
    @IsOptional()
    hasVariants?: boolean;
}
