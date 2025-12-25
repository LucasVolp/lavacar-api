import { Logger, Module } from '@nestjs/common';
import { ServiceGroupService } from './service-group.service';
import { ServiceGroupController } from './service-group.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { ShopModule } from '../shop/shop.module';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, ShopModule],
    controllers: [ServiceGroupController],
    providers: [ServiceGroupService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class ServiceGroupModule {}
