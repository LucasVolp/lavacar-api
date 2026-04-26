import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsEnum, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { ShopStatus } from 'src/modules/shop/types/ShopStatus';

// ShopId e weekday não podem ser alterados
export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
    @IsEnum(ShopStatus)
    @IsOptional()
    isOpen?: ShopStatus;

    @IsString()
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
    startTime?: string;

    @IsString()
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
    endTime?: string;

    @IsString()
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakStartTime must be in HH:mm format' })
    breakStartTime?: string;

    @IsString()
    @IsOptional()
    @ValidateIf(o => o.breakStartTime !== undefined)
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakEndTime must be in HH:mm format' })
    breakEndTime?: string;
}
