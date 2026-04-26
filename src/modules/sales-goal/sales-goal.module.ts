import { Logger, Module } from '@nestjs/common';
import { SalesGoalService } from './sales-goal.service';
import { SalesGoalController } from './sales-goal.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { ShopModule } from '../shop/shop.module';
import { OrganizationModule } from '../organization/organization.module';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, ShopModule, OrganizationModule],
    controllers: [SalesGoalController],
    providers: [SalesGoalService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class SalesGoalModule {}