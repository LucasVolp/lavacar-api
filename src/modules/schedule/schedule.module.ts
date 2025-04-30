import { Logger, Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const useCases = Object.values(UseCases);


@Module({
  imports: [SharedModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, Logger, ...repositories, ...useCases],
})
export class ScheduleModule {}
