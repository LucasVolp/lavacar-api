import { PartialType } from '@nestjs/mapped-types';
import { CreateChecklistDto } from './create-checklist.dto';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {
    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    photos?: string[];
}