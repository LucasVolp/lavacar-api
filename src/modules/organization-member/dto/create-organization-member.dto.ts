import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from 'prisma/generated';

export class CreateOrganizationMemberDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    organizationId: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
