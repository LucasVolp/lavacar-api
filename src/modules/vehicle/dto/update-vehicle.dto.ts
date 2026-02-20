import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { VehicleSize, VehicleType } from 'prisma/generated';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
        message: 'plate must be a valid Brazilian plate (AAA0A00 or AAA0000)'
    })
    plate?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear() + 1)
    @IsOptional()
    year?: number;

    @IsString()
    @IsOptional()
    color?: string;

    @IsEnum(VehicleSize)
    @IsOptional()
    size?: VehicleSize;

    @IsEnum(VehicleType)
    @IsOptional()
    type?: VehicleType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
