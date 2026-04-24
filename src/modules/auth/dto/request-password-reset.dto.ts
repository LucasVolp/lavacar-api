import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'email deve ser um endereço válido.' })
  @IsNotEmpty()
  email: string;
}
