import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBlockedTimeDto } from './create-blocked-time.dto';

// ShopId não pode ser alterado
export class UpdateBlockedTimeDto extends PartialType(
    OmitType(CreateBlockedTimeDto, ['shopId'] as const)
) {}
