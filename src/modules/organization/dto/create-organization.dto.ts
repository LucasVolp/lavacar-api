import { IsString, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(18)
    document?: string; // CNPJ

    @IsOptional()
    @IsUrl()
    logoUrl?: string;
}
