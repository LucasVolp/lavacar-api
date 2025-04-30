import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsEnum, IsString } from 'class-validator';
import { Weekday } from '../types/Weekday';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
        @IsEnum(Weekday)
        weekday: Weekday;
    
        @IsString()
        startTime: string;
    
        @IsString()
        endTime: string;
}
