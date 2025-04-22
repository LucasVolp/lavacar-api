import { IsNumber, IsString, IsUUID } from "class-validator";

export class CreateServiceDto {

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    price: number;

    @IsNumber()
    duration: number;

    @IsString()
    @IsUUID()
    shopId: string;


}
