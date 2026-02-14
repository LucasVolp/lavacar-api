import { PartialType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';
import { IsEmail, IsEnum, IsInt, IsJSON, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
import { ShopStatus } from '../types/ShopStatus';

// OwnerId não pode ser alterado após criação
export class UpdateShopDto extends PartialType(CreateShopDto) {
    @IsString()
    @IsOptional()
    name?: string;
  
    @IsString()
    @IsOptional()
    description?: string;
  
    @IsString()
    @IsOptional()
    document?: string; // CNPJ

    @IsOptional()
    @IsString()
    slug?: string;
  
    @IsString()
    @IsOptional()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
    phone?: string;
  
    @IsEmail()
    @IsOptional()
    email?: string;
  
    @IsEnum(ShopStatus)
    @IsOptional()
    status?: ShopStatus;
  
    @IsString()
    @IsOptional()
    timeZone?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsString()
    @IsOptional()
    bannerUrl?: string;

    @IsJSON()
    @IsOptional()
    socialLinks?: JSON;

    // Endereço
    @IsString()
    @IsOptional()
    @Matches(/^\d{5}-?\d{3}$/, { message: 'zipCode must be a valid CEP' })
    zipCode?: string;
  
    @IsString()
    @IsOptional()
    street?: string;
  
    @IsString()
    @IsOptional()
    number?: string;
  
    @IsString()
    @IsOptional()
    complement?: string;
  
    @IsString()
    @IsOptional()
    neighborhood?: string;
  
    @IsString()
    @IsOptional()
    city?: string;
  
    @IsString()
    @IsOptional()
    @Length(2, 2)
    state?: string;
  
    // Configurações
    @IsInt()
    @Min(15)
    @Max(60)
    @IsOptional()
    slotInterval?: number;
  
    @IsInt()
    @Min(0)
    @Max(60)
    @IsOptional()
    bufferBetweenSlots?: number;
  
    @IsInt()
    @Min(1)
    @Max(90)
    @IsOptional()
    maxAdvanceDays?: number;
  
    @IsInt()
    @Min(0)
    @IsOptional()
    minAdvanceMinutes?: number;
  
    @IsUUID()
    @IsOptional()
    organizationId?: string;
  
    @IsUUID()
    @IsOptional()
    ownerId?: string;
}
