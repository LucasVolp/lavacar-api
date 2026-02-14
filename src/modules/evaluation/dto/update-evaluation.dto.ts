import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluationDto } from './create-evaluation.dto';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// AppointmentId e userId não podem ser alterados
export class UpdateEvaluationDto extends PartialType(CreateEvaluationDto) {
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsString({ each: true })
    @IsOptional()
    photos?: string[];
}
