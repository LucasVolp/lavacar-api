import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsDateString, IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';
import { Role } from '../types/Role';

export class UpdateUserDto extends PartialType(CreateUserDto) {

        @IsString()
        name: string;
    
        @IsEmail()
        email: string;
    
        @IsString()
        @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        })
        password: string;
    
        @IsEnum(Role)
        role: Role
    
        @IsDateString()
        createdAt: Date
    
        @IsDateString()
        updatedAt: Date
}
