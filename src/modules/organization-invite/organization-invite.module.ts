import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrganizationInviteController } from './organization-invite.controller';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
  imports: [UsersModule],
  controllers: [OrganizationInviteController],
  providers: [...repositories, ...usecases],
})
export class OrganizationInviteModule {}
