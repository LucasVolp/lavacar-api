import { PartialType } from '@nestjs/mapped-types';
import { CreateShopManagerDto } from './create-shop-manager.dto';

export class UpdateShopManagerDto extends PartialType(CreateShopManagerDto) {}
