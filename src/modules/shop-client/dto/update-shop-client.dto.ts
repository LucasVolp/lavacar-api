import { IsOptional, IsString } from 'class-validator';

export class UpdateShopClientDto {
    @IsString()
    @IsOptional()
    customName?: string;

    @IsString()
    @IsOptional()
    customPhone?: string;

    @IsString()
    @IsOptional()
    customEmail?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}