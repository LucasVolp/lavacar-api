import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @IsInt()
    @Min(1)
    duration: number; // Em minutos

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @IsUUID()
    @IsOptional()
    groupId?: string;
}
