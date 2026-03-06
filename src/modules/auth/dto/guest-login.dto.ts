import { IsOptional, IsString, Matches, IsNotEmpty, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType, VehicleSize } from 'prisma/generated/enums';

class GuestVehicleDto {
  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsEnum(VehicleSize)
  size: VehicleSize;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  year?: number;
}

export class GuestLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuestVehicleDto)
  vehicle?: GuestVehicleDto;
}
