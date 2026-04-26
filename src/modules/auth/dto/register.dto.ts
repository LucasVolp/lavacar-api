import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const BLOCKED_EMAIL_DOMAINS = /^(?!.+@(.*\.)?nexocar\.com\.br$).+$/i;
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'.\-]+$/;

function sanitizeName(value: unknown): string | unknown {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/<[^>]*>/g, '').replace(/[;&]/g, '').slice(0, 100);
}

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Matches(NAME_PATTERN, { message: 'Nome inválido. Use apenas letras, espaços, hífens e apóstrofos.' })
    @Transform(({ value }) => sanitizeName(value))
    firstName: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Matches(NAME_PATTERN, { message: 'Sobrenome inválido. Use apenas letras, espaços, hífens e apóstrofos.' })
    @Transform(({ value }) => sanitizeName(value))
    lastName?: string;

    @IsEmail({}, { message: 'E-mail inválido.' })
    @Matches(BLOCKED_EMAIL_DOMAINS, { message: 'Domínio de e-mail não permitido.' })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
    email?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
    phone: string;
}
