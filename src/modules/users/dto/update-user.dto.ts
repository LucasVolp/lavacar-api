import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../types/Role';

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'.\-]+$/;

function sanitizeName(value: unknown): string | unknown {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/<[^>]*>/g, '').replace(/[;&]/g, '').slice(0, 100);
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Matches(NAME_PATTERN, { message: 'Nome inválido. Use apenas letras, espaços, hífens e apóstrofos.' })
    @Transform(({ value }) => sanitizeName(value))
    firstName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Matches(NAME_PATTERN, { message: 'Sobrenome inválido. Use apenas letras, espaços, hífens e apóstrofos.' })
    @Transform(({ value }) => sanitizeName(value))
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'cpf must be in format XXX.XXX.XXX-XX' })
    cpf?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'phone must be a valid phone number' })
    phone?: string;

    @IsString()
    @IsOptional()
    picture?: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isGuest?: boolean;
}
