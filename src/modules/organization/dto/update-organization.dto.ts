import { IsString, IsOptional, IsUrl, MaxLength, MinLength, IsBoolean, IsUUID } from 'class-validator';

export class UpdateOrganizationDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(18)
    document?: string;

    @IsOptional()
    @IsUUID()
    ownerId?: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
