import { Module } from '@nestjs/common';
import { ShopManagerService } from './shop-manager.service';
import { ShopManagerController } from './shop-manager.controller';

@Module({
  controllers: [ShopManagerController],
  providers: [ShopManagerService],
})
export class ShopManagerModule {}
