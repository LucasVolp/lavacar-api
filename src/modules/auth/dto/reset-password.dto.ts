import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/i, { message: 'token inválido.' })
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  newPassword: string;
}
