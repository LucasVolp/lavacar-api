import { IsDate, IsString } from "class-validator";

export class CreateBlockedTimeDto {
    @IsDate()
    date: Date;

    @IsString()
    reason: string;

    @IsString()
    shopId: string;
}
