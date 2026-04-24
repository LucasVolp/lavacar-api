import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Role } from 'prisma/generated';

export class SendInviteDto {
  @IsUUID('4', { message: 'organizationId deve ser um UUID válido.' })
  @IsNotEmpty()
  organizationId: string;

  @IsUUID('4', { message: 'shopId deve ser um UUID válido.' })
  @IsOptional()
  shopId?: string;

  @IsEmail({}, { message: 'email deve ser um endereço válido.' })
  @IsNotEmpty()
  email: string;

  @IsEnum(Role, { message: 'role deve ser MANAGER ou EMPLOYEE.' })
  role: Extract<Role, 'MANAGER' | 'EMPLOYEE'>;
}
