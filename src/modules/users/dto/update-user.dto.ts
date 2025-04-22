import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { Role } from '../types/Role';

export class UpdateUserDto extends PartialType(CreateUserDto) {

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsEnum(Role)
    @IsNotEmpty()
    role: Role
}
