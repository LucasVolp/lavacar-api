import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceVariantDto } from './create-service-variant.dto';
import { IsEnum, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { VehicleSize } from 'prisma/generated';

export class UpdateServiceVariantDto extends PartialType(CreateServiceVariantDto) {
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @IsOptional()
    price?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsEnum(VehicleSize)
    @IsOptional()
    size?: VehicleSize;

    @IsUUID()
    @IsOptional()
    serviceId?: string;
}
