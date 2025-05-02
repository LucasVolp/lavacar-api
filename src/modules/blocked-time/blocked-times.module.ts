import { Logger, Module } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { BlockedTimesController } from './blocked-times.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const usecases = Object.values(UseCases)
const repositories = Object.values(Repositories)

@Module({
  imports: [SharedModule],
  controllers: [BlockedTimesController],
  providers: [BlockedTimesService, Logger, ...usecases, ...repositories],
})
export class BlockedTimesModule {}
