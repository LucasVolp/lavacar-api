import { Logger, Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository'
import * as UseCases from './use-cases'

const repositories = Object.values(Repositories)
const usecases = Object.values(UseCases)

@Module({
  imports: [SharedModule],
  controllers: [ServiceController],
  providers: [ServiceService, Logger, ...repositories, ...usecases],

})
export class ServiceModule {}
