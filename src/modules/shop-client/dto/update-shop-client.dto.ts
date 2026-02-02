import { PartialType } from '@nestjs/mapped-types';
import { CreateShopClientDto } from './create-shop-client.dto';

export class UpdateShopClientDto extends PartialType(CreateShopClientDto) {}