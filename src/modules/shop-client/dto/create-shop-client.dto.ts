import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShopClientDto {
    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;

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