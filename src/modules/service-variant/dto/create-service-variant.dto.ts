import { IsEnum, IsInt, IsNumber, IsUUID, Min } from "class-validator";
import { VehicleSize } from "prisma/generated";

export class CreateServiceVariantDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @IsInt()
    @Min(1)
    duration: number;

    @IsEnum(VehicleSize)
    size: VehicleSize;

    @IsUUID()
    serviceId: string;
}
