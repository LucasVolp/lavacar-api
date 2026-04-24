import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ConfirmEmailChangeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/i, { message: 'token inválido.' })
  token: string;
}
