import { PartialType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';
import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateShopDto extends PartialType(CreateShopDto) {
    @IsString()
    name: string;
    
    @IsString()
    address: string;
    
    @IsOptional()
    @IsNumber()
    latitude?: number;
    
    @IsOptional()
    @IsNumber()
    longitude?: number;
    
    @IsString()
    @IsPhoneNumber()
    contactPhone: string;
    
    @IsString()
    ownerId: string;
}
