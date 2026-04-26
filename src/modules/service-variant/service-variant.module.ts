import { Logger, Module } from '@nestjs/common';
import { ServiceVariantService } from './service-variant.service';
import { ServiceVariantController } from './service-variant.controller';
import { SharedModule } from 'src/shared/shared.module';
import { ServiceModule } from '../service/service.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const useCases = Object.values(UseCases);

@Module({
  imports: [SharedModule, ServiceModule],
  controllers: [ServiceVariantController],
  providers: [ServiceVariantService, Logger, ...repositories, ...useCases],
})
export class ServiceVariantModule {}
