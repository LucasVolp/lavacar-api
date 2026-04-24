import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail({}, { message: 'newEmail deve ser um endereço válido.' })
  @IsNotEmpty()
  newEmail: string;
}
