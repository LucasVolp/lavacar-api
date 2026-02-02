import { PartialType } from '@nestjs/mapped-types';
import { CreateFipeApiDto } from './create-fipe-api.dto';

export class UpdateFipeApiDto extends PartialType(CreateFipeApiDto) {}
