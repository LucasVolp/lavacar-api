import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingDto } from './create-customer.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from 'prisma/generated';

export class UpdateBillingDto extends PartialType(CreateBillingDto) {
    @IsEnum(Status)
    @IsOptional()
    status?: Status;
}
