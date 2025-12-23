import { Logger, Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { SharedModule } from 'src/shared/shared.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
    imports: [SharedModule],
    controllers: [EvaluationController],
    providers: [EvaluationService, Logger, ...repositories, ...usecases],
    exports: [...repositories],
})
export class EvaluationModule {}
