import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, ValidateIf } from "class-validator";
import { BlockedTimeType } from "../types/BlockedTimeType";

export class CreateBlockedTimeDto {
    @IsEnum(BlockedTimeType)
    @IsNotEmpty()
    type: BlockedTimeType;

    @IsDateString()
    @IsNotEmpty()
    date: string; // ISO date string "2025-12-25"

    @IsString()
    @IsOptional()
    reason?: string;

    // Obrigatório apenas se type === PARTIAL
    @IsString()
    @ValidateIf(o => o.type === 'PARTIAL')
    @IsNotEmpty({ message: 'startTime is required for PARTIAL blocked time' })
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
    startTime?: string;

    @IsString()
    @ValidateIf(o => o.type === 'PARTIAL')
    @IsNotEmpty({ message: 'endTime is required for PARTIAL blocked time' })
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
    endTime?: string;

    @IsUUID()
    @IsNotEmpty()
    shopId: string;
}
