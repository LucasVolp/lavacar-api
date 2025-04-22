import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';
import { IsNumber, IsString } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    price: number;

    @IsNumber()
    duration: number;
}
