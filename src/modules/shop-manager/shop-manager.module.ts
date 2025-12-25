import { Logger, Module } from '@nestjs/common';
import { ShopManagerService } from './shop-manager.service';
import { ShopManagerController } from './shop-manager.controller';
import { SharedModule } from 'src/shared/shared.module';
import { OrganizationMemberModule } from '../organization-member/organization-member.module';
import { ShopModule } from '../shop/shop.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, OrganizationMemberModule, ShopModule],
    controllers: [ShopManagerController],
    providers: [ShopManagerService, Logger, ...repositories, ...usecases],
    exports: [...repositories, ...usecases],
})
export class ShopManagerModule {}
