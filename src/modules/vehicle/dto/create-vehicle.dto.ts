import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, Min } from "class-validator";
import { VehicleType } from "prisma/generated";

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, { 
        message: 'plate must be a valid Brazilian plate (AAA0A00 or AAA0000)' 
    })
    plate: string;

    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear() + 1)
    @IsOptional()
    year?: number;

    @IsString()
    @IsOptional()
    color?: string;

    @IsEnum(VehicleType)
    @IsOptional()
    type?: VehicleType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsUUID()
    @IsNotEmpty()
    userId: string;
}
