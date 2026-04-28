import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { CreateBillingDto } from './dto/create-customer.dto';
import { CreateAsaasSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSelfCheckoutDto } from './dto/create-self-checkout.dto';
import { AsaasWebhookDto } from './dto/webhook.dto';
import { PaymentMethod } from 'prisma/generated';
import { BillingService } from './billing.service';
import { AsaasService } from './services/asaas.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('billing')
export class BillingController {
    private readonly logger = new Logger(BillingController.name);

    constructor(
        private readonly billingService: BillingService,
        private readonly asaasService: AsaasService,
    ) {}

    @Public()
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() webhookData: AsaasWebhookDto,
        @Headers('asaas-access-token') webhookToken: string,
    ) {
        this.asaasService.validateWebhookToken(webhookToken);

        const savedEvent = await this.billingService.saveWebhookEvent(webhookData);
        if (!savedEvent) return { received: true };

        setImmediate(async () => {
            try {
                await this.billingService.processWebhookEvent(savedEvent.id);
            } catch (err: unknown) {
                this.logger.error(`Webhook processing failed for event ${savedEvent.id}: ${(err as Error).message}`);
            }
        });

        return { received: true };
    }

    @Get('status')
    getBillingStatus(@CurrentUser() user: JwtPayload) {
        return this.billingService.getBillingStatus(user.id, user.role);
    }

    @Post('checkout/self')
    createSelfCheckout(
        @Body() data: CreateSelfCheckoutDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.billingService.createSelfCheckout(user.id, data);
    }

    @Post('checkout/:organizationId')
    @Roles(Role.ADMIN, Role.OWNER)
    createCheckout(
        @Param('organizationId') organizationId: string,
        @Body('billing') billing: CreateBillingDto,
        @Body('asaas') asaas: CreateAsaasSubscriptionDto,
    ) {
        return this.billingService.createCheckout(organizationId, billing, asaas);
    }

    @Get('subscriptions')
    @Roles(Role.ADMIN, Role.OWNER)
    findAll(
        @Query('organizationId') organizationId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedPage = parseInt(page ?? '', 10);
        const parsedLimit = parseInt(limit ?? '', 10);
        return this.billingService.findAll(
            organizationId,
            !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : undefined,
            !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined,
        );
    }

    @Get('subscriptions/:id')
    @Roles(Role.ADMIN, Role.OWNER)
    findById(@Param('id') id: string) {
        return this.billingService.findById(id);
    }

    @Post('subscriptions/:id/cancel')
    @Roles(Role.ADMIN, Role.OWNER)
    cancelSubscription(@Param('id') id: string) {
        return this.billingService.cancelSubscription(id);
    }

    @Get('subscriptions/:id/payments')
    @Roles(Role.ADMIN, Role.OWNER)
    listSubscriptionPayments(@Param('id') id: string) {
        return this.billingService.listPayments({ subscription: id });
    }

    @Get('payments')
    @Roles(Role.ADMIN, Role.OWNER)
    listPayments(
        @Query('subscription') subscription?: string,
        @Query('status') status?: string,
    ) {
        return this.billingService.listPayments({ subscription, status });
    }

    @Get('payments/:id')
    @Roles(Role.ADMIN, Role.OWNER)
    getPayment(@Param('id') id: string) {
        return this.billingService.getPayment(id);
    }

    @Get('payments/:id/pix-qrcode')
    @Roles(Role.ADMIN, Role.OWNER)
    getPaymentPixQrCode(@Param('id') id: string) {
        return this.billingService.getPaymentPixQrCode(id);
    }

    @Patch(':id/subscription')
    @Roles(Role.ADMIN, Role.OWNER)
    updateSubscription(
        @Param('id') id: string,
        @Body('billingType') billingType: PaymentMethod,
    ) {
        return this.billingService.updateSubscription(id, billingType);
    }
}
