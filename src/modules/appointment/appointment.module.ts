import { Logger, Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { UsersModule } from '../users/users.module';
import { ShopModule } from '../shop/shop.module';
import { ServiceModule } from '../service/service.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { BlockedTimesModule } from '../blocked-time/blocked-times.module';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, UsersModule, ShopModule, ServiceModule, ScheduleModule, VehicleModule, BlockedTimesModule],
    controllers: [AppointmentController],
    providers: [AppointmentService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class AppointmentModule {}
