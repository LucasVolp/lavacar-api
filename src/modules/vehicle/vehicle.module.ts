import { Logger, Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { UsersModule } from '../users/users.module';

const repositories = Object.values(Repositories);
const useCases = Object.values(UseCases);

@Module({
  imports: [SharedModule, UsersModule],
  controllers: [VehicleController],
  providers: [VehicleService, Logger, ...repositories, ...useCases],
})
export class VehicleModule {}
