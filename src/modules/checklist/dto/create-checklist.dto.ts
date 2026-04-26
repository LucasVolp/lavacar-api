import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateChecklistDto {
    @IsUUID()
    @IsNotEmpty()
    appointmentId: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsUrl({}, { each: true })
    @IsOptional()
    photos?: string[];
}