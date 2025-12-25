import { PartialType } from '@nestjs/mapped-types';
import { CreateShopManagerDto } from './create-shop-manager.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateShopManagerDto extends PartialType(CreateShopManagerDto) {
    @IsOptional()
    @IsUUID()
    memberId?: string;
    
    @IsOptional()
    @IsUUID()
    shopId?: string;
}
