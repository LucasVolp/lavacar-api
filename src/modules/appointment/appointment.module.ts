import { Logger, Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule],
    controllers: [AppointmentController],
    providers: [AppointmentService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class AppointmentModule {}
