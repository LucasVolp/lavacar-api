import { IsString, IsUUID } from "class-validator";

export class CreateVehicleDto {

    @IsString()
    brand: string;

    @IsString()
    model: string;

    @IsString()
    color: string;

    @IsString()
    plate: string;

    @IsUUID()
    userId: string;
    
}
