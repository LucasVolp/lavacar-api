import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterShopClientDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    perPage?: number;
}
