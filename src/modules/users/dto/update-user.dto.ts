import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { Role } from '../types/Role';

// Email não pode ser alterado após criação (ou pode, dependendo da regra de negócio)
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
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
}
