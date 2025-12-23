import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';

// ShopId e weekday não podem ser alterados
export class UpdateScheduleDto extends PartialType(
    OmitType(CreateScheduleDto, ['shopId', 'weekday'] as const)
) {}
