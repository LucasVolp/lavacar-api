import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateEvaluationDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    rating: number;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString({ each: true })
    @IsOptional()
    photos?: string[];
}
