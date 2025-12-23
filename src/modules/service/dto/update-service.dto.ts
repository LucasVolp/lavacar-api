import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

// ShopId não pode ser alterado após criação
export class UpdateServiceDto extends PartialType(
    OmitType(CreateServiceDto, ['shopId'] as const)
) {}
