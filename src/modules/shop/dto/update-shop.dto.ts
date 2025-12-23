import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';

// OwnerId não pode ser alterado após criação
export class UpdateShopDto extends PartialType(
  OmitType(CreateShopDto, ['ownerId'] as const)
) {}
