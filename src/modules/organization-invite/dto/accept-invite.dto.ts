import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'.\-]+$/;

function sanitizeName(value: unknown): string | unknown {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/<[^>]*>/g, '').replace(/[;&]/g, '').slice(0, 100);
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-f0-9]{64}$/i, { message: 'token inválido.' })
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(NAME_PATTERN, { message: 'Nome inválido.' })
  @Transform(({ value }) => sanitizeName(value))
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(NAME_PATTERN, { message: 'Sobrenome inválido.' })
  @Transform(({ value }) => sanitizeName(value))
  lastName?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Telefone inválido.' })
  phone?: string; // optional only for existing users — use-case enforces required for new account creation
}
