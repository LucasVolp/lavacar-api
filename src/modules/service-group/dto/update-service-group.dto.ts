import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceGroupDto } from './create-service-group.dto';

// ShopId não pode ser alterado
export class UpdateServiceGroupDto extends PartialType(
    OmitType(CreateServiceGroupDto, ['shopId'] as const)
) {}
