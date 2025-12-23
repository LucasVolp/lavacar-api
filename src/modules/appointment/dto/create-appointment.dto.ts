import { 
    ArrayMinSize, 
    IsArray, 
    IsDateString, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    IsUUID, 
    Matches 
} from "class-validator";

export class CreateAppointmentDto {
    @IsDateString()
    @IsNotEmpty()
    scheduledDate: string; // "2025-12-25"

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'scheduledTime must be in HH:mm format' })
    scheduledTime: string; // "10:00"

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsNotEmpty()
    shopId: string;

    @IsUUID()
    @IsNotEmpty()
    vehicleId: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one service is required' })
    @IsUUID('4', { each: true })
    serviceIds: string[];
}
