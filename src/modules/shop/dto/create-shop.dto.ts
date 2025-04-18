import { IsNumber, IsOptional, IsPhoneNumber, IsString, IsUUID } from "class-validator";

export class CreateShopDto {
    @IsUUID()
    id: string;

    @IsString()
    name: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsString()
    @IsPhoneNumber()
    contactPhone: string;

    @IsString()
    ownerId: string;

}
