import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated';

export class UpdateAppointmentDto {
    @IsEnum(AppointmentStatus)
    @IsOptional()
    status?: AppointmentStatus;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    cancellationReason?: string;
}
