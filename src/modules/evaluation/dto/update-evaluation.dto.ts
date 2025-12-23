import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateEvaluationDto } from './create-evaluation.dto';

// AppointmentId e userId não podem ser alterados
export class UpdateEvaluationDto extends PartialType(
    OmitType(CreateEvaluationDto, ['appointmentId', 'userId'] as const)
) {}
