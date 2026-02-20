import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { VehicleSize } from "prisma/generated";

export class CreateAppointmentServiceData {
    @IsUUID()
    @IsNotEmpty()
    serviceId: string;

    @IsString()
    @IsNotEmpty()
    serviceName: string;

    @IsNotEmpty()
    @IsNumber({ maxDecimalPlaces: 2 })
    servicePrice: number;

    @IsNumber()
    @IsNotEmpty()
    duration: number;

    @IsBoolean()
    @IsOptional()
    isBudget?: boolean;

    @IsEnum(VehicleSize)
    @IsOptional()
    vehicleSize?: VehicleSize;
}

export class CreateAppointmentDto {
    @IsDateString()
    @IsNotEmpty()
    scheduledAt: string;

    @IsDateString()
    @IsNotEmpty()
    endTime: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsNotEmpty()
    totalPrice: number;

    @IsNumber()
    @IsNotEmpty()
    totalDuration: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @IsUUID()
    @IsNotEmpty()
    vehicleId: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one service is required' })
    @ValidateNested({ each: true })
    @Type(() => CreateAppointmentServiceData)
    serviceIds: CreateAppointmentServiceData[];
}
