import { 
    BadRequestException, 
    ConflictException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { CreateEvaluationRepository, FindEvaluationByIdRepository } from "../repository";
import { CreateEvaluationDto } from "../dto/create-evaluation.dto";
import { PrismaService } from "src/shared/databases/prisma.database";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class CreateEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: CreateEvaluationRepository,
        private readonly findByIdRepository: FindEvaluationByIdRepository,
        private readonly prisma: PrismaService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateEvaluationDto) {
        try {
            // 1. Verificar se o agendamento existe e está concluído
            const appointment = await this.prisma.appointment.findUnique({
                where: { id: data.appointmentId },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            if (appointment.status !== AppointmentStatus.COMPLETED) {
                throw new BadRequestException('Can only evaluate completed appointments');
            }

            // 2. Verificar se o usuário é o dono do agendamento
            if (appointment.userId !== data.userId) {
                throw new BadRequestException('You can only evaluate your own appointments');
            }

            // 3. Verificar se já existe avaliação para este agendamento
            const existingEvaluation = await this.findByIdRepository.findByAppointmentId(data.appointmentId);

            if (existingEvaluation) {
                throw new ConflictException('This appointment has already been evaluated');
            }

            // 4. Criar avaliação
            const evaluation = await this.evaluationRepository.create(data);
            this.logger.log(`Evaluation created for appointment: ${data.appointmentId}`, CreateEvaluationUseCase.name);
            return evaluation;
        } catch (err) {
            if (
                err instanceof NotFoundException ||
                err instanceof BadRequestException ||
                err instanceof ConflictException
            ) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating evaluation',
            });
            this.logger.error(error.message, err.stack, CreateEvaluationUseCase.name);
            throw error;
        }
    }
}
