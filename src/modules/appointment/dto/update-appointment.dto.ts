import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from 'prisma/generated';

// UserId, shopId, vehicleId e serviceIds não podem ser alterados após criação
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
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
