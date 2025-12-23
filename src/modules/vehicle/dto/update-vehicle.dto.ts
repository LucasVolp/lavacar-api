import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle.dto';

// UserId não pode ser alterado após criação
export class UpdateVehicleDto extends PartialType(
    OmitType(CreateVehicleDto, ['userId'] as const)
) {}
