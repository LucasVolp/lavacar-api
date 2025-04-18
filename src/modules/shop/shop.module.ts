import { Logger, Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
  imports: [SharedModule],
  controllers: [ShopController],
  providers: [ShopService, Logger, ...repositories, ...usecases],
})
export class ShopModule {}
