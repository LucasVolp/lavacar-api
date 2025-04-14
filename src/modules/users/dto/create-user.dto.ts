import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../types/Role";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsEnum(Role)
    @IsNotEmpty()
    role: Role

    @IsOptional()
    shops?: string[]; // IDs das lojas relacionadas ao usuário

    @IsOptional()
    vehicles?: string[]; // IDs dos veículos relacionados ao usuário

    @IsOptional()
    appointments?: string[];
}
