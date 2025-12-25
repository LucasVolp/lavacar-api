import { Logger, Module } from '@nestjs/common';
import { OrganizationMemberService } from './organization-member.service';
import { OrganizationMemberController } from './organization-member.controller';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from '../users/users.module';
import { OrganizationModule } from '../organization/organization.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule, UsersModule, OrganizationModule],
    controllers: [OrganizationMemberController],
    providers: [OrganizationMemberService, Logger, ...repositories, ...usecases],
    exports: [...repositories, ...usecases],
})
export class OrganizationMemberModule {}
