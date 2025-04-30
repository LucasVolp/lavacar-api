import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockedTimeDto } from './create-blocked-time.dto';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateBlockedTimeDto extends PartialType(CreateBlockedTimeDto) {
    
    @IsOptional()
    @IsDate()
    date: Date;

    @IsOptional()
    @IsString()
    reason: string;
}
