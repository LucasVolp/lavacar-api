import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-customer.dto';
import { CreateAsaasSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentMethod } from 'prisma/generated';
import { BillingService } from './billing.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('billing')
@Roles(Role.ADMIN, Role.OWNER)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post('checkout/:organizationId')
  createCheckout(
    @Param('organizationId') organizationId: string,
    @Body('billing') billing: CreateBillingDto,
    @Body('asaas') asaas: CreateAsaasSubscriptionDto
  ) {
    return this.billingService.createCheckout(organizationId, billing, asaas);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.billingService.findAll(
      organizationId, 
      page ? Number(page) : undefined, 
      limit ? Number(limit) : undefined
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.billingService.findById(id);
  }

  @Patch(':id/subscription')
  updateSubscription(
    @Param('id') id: string, 
    @Body('billingType') billingType: PaymentMethod
  ) {
    return this.billingService.updateSubscription(id, billingType);
  }
}
