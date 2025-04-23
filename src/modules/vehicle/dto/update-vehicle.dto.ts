import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsString } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
        @IsString()
        brand: string;
    
        @IsString()
        model: string;
    
        @IsString()
        color: string;
    
        @IsString()
        plate: string;
    
}
