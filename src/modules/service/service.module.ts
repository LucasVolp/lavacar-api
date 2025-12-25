import { Logger, Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository'
import * as UseCases from './use-cases'
import { ServiceGroupModule } from '../service-group/service-group.module';
import { ShopModule } from '../shop/shop.module';

const repositories = Object.values(Repositories)
const usecases = Object.values(UseCases)

@Module({
  imports: [SharedModule, ServiceGroupModule, ShopModule],
  controllers: [ServiceController],
  providers: [ServiceService, Logger, ...repositories, ...usecases],
  exports: [...repositories],

})
export class ServiceModule {}
