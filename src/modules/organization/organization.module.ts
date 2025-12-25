import { Logger, Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule],
    controllers: [OrganizationController],
    providers: [OrganizationService, Logger, ...repositories, ...usecases],
    exports: [...repositories, ...usecases],
})
export class OrganizationModule {}
