import { Logger, Module } from '@nestjs/common';
import { ShopClientService } from './shop-client.service';
import { ShopClientController } from './shop-client.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { ShopModule } from '../shop/shop.module';
import { UsersModule } from '../users/users.module';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, ShopModule, UsersModule],
    controllers: [ShopClientController],
    providers: [ShopClientService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class ShopClientModule {}