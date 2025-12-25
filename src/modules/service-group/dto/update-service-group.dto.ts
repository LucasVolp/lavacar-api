import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceGroupDto } from './create-service-group.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

// ShopId não pode ser alterado
export class UpdateServiceGroupDto extends PartialType(CreateServiceGroupDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
