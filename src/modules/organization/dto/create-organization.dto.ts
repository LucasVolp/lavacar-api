import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @MinLength(11)
    @MaxLength(18)
    document: string;

    @IsUUID()
    ownerId: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
