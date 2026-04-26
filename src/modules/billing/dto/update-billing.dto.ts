import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingDto } from './create-customer.dto';
import { IsEnum, IsOptional, IsDate } from 'class-validator';
import { Status } from 'prisma/generated';
import { Type } from 'class-transformer';

export class UpdateBillingDto extends PartialType(CreateBillingDto) {
    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    cancelledAt?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    expiresAt?: Date;
}
