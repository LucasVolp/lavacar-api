import { Logger, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository'
import * as UseCases from './use-cases'

const repositories = Object.values(Repositories)
const usecases = Object.values(UseCases)

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [UsersService, Logger, ...repositories, ...usecases],
})
export class UsersModule {}
