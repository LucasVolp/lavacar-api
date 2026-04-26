import { Logger, Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { OrganizationModule } from '../organization/organization.module';
import { UsersModule } from '../users/users.module';
import { AsaasService } from './services/asaas.service';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const usecases = Object.values(UseCases);
const repositories = Object.values(Repositories);

@Module({
    controllers: [BillingController],
    providers: [
        BillingService,
        AsaasService,
        ...usecases,
        ...repositories,
        Logger,
    ],
    imports: [OrganizationModule, UsersModule],
})
export class BillingModule {}
