import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/i, { message: 'token inválido.' })
  token: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
