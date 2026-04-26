import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated';

// userId, shopId, vehicleId e serviceIds NÃO podem ser alterados
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
