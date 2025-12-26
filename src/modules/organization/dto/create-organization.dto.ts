import { IsString, IsOptional, IsUrl, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(18)
    document?: string; // CNPJ

    @IsUUID()
    ownerId: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;
}
