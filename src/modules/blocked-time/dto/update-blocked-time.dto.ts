import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockedTimeDto } from './create-blocked-time.dto';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { BlockedTimeType } from 'prisma/generated';

// ShopId não pode ser alterado
export class UpdateBlockedTimeDto extends PartialType(CreateBlockedTimeDto) {
    @IsEnum(BlockedTimeType)
    @IsOptional()
    type?: BlockedTimeType;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @ValidateIf(o => o.type === 'PARTIAL')
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
    startTime?: string;

    @IsString()
    @ValidateIf(o => o.type === 'PARTIAL')
    @IsOptional()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
    endTime?: string;
}
