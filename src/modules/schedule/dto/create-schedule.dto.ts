import { IsEnum, IsString } from "class-validator";
import { Weekday } from "../types/Weekday";

export class CreateScheduleDto {
    @IsEnum(Weekday)
    weekday: Weekday;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsString()
    shopId: string;
}
