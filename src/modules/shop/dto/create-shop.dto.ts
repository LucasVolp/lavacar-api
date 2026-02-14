import { 
  IsEmail, 
  IsEnum, 
  IsInt, 
  IsJSON, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  Length, 
  Matches, 
  Max, 
  Min 
} from "class-validator";
import { ShopStatus } from "../types/ShopStatus";

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  document?: string; // CNPJ

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
  phone: string;

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
  @IsNotEmpty()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'zipCode must be a valid CEP' })
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  state: string;

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
  @IsNotEmpty()
  organizationId: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
