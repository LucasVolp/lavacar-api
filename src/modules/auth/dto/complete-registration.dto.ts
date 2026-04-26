import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const BLOCKED_EMAIL_DOMAINS = /^(?!.+@(.*\.)?nexocar\.com\.br$).+$/i;
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'.\-]+$/;

function sanitizeName(value: unknown): string | unknown {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/<[^>]*>/g, '').replace(/[;&]/g, '').slice(0, 100);
}

export class CompleteRegistrationDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
    phone: string;

    @IsEmail({}, { message: 'E-mail inválido.' })
    @Matches(BLOCKED_EMAIL_DOMAINS, { message: 'Domínio de e-mail não permitido.' })
    @IsNotEmpty()
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
    email: string;

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

    @IsString()
    @IsOptional()
    picture?: string;
}
