import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from 'prisma/generated';

export class UpdateOrganizationMemberDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
