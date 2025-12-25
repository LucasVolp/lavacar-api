import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, ValidateIf } from "class-validator";
import { Weekday } from "../types/Weekday";
import { ShopStatus } from "src/modules/shop/types/ShopStatus";

export class CreateScheduleDto {
    @IsEnum(Weekday)
    @IsNotEmpty()
    weekday: Weekday;

    @IsEnum(ShopStatus)
    @IsOptional()
    isOpen?: ShopStatus;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
    startTime: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
    endTime: string;

    // Intervalo (almoço)
    @IsString()
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakStartTime must be in HH:mm format' })
    breakStartTime?: string;

    @IsString()
    @IsOptional()
    @ValidateIf(o => o.breakStartTime !== undefined)
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakEndTime must be in HH:mm format' })
    breakEndTime?: string;

    @IsUUID()
    @IsNotEmpty()
    shopId: string;
}
