import { Logger, Module } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import { AppointmentModule } from '../appointment/appointment.module';
import { UsersModule } from '../users/users.module';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, AppointmentModule, UsersModule],
    controllers: [ChecklistController],
    providers: [ChecklistService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class ChecklistModule {}