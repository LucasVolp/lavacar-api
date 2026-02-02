import { Module } from '@nestjs/common';
import { FipeApiService } from './fipe-api.service';
import { FipeApiController } from './fipe-api.controller';

@Module({
  controllers: [FipeApiController],
  providers: [FipeApiService],
})
export class FipeApiModule {}
