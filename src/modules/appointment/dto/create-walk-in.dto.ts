import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleSize, VehicleType } from 'prisma/generated';

export class WalkInUserData {
    @IsUUID()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
    phone: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}

export class WalkInVehicleData {
    @IsUUID()
    @IsOptional()
    id?: string;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
        message: 'plate must be a valid Brazilian plate (AAA0A00 or AAA0000)',
    })
    plate?: string;

    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsEnum(VehicleType)
    @IsOptional()
    type?: VehicleType;

    @IsEnum(VehicleSize)
    @IsOptional()
    size?: VehicleSize;
}

export class CreateWalkInDto {
    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @ValidateNested()
    @Type(() => WalkInUserData)
    @IsNotEmpty()
    user: WalkInUserData;

    @ValidateNested()
    @Type(() => WalkInVehicleData)
    @IsNotEmpty()
    vehicle: WalkInVehicleData;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one service is required' })
    @IsUUID('4', { each: true })
    serviceIds: string[];

    @IsString()
    @IsOptional()
    notes?: string;
}
