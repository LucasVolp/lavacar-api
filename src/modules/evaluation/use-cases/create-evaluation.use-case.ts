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
import { AppointmentStatus } from "prisma/generated";
import { FindAppointmentByIdRepository } from "src/modules/appointment/repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class CreateEvaluationUseCase {
    constructor(
        private readonly evaluationRepository: CreateEvaluationRepository,
        private readonly findEvaluationByIdRepository: FindEvaluationByIdRepository,
        private readonly findAppointmentRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateEvaluationDto, user: JwtPayload) {
        try {
            if (user.role === 'USER') {
                data.userId = user.id;
            }

            this.logger.log(`Creating evaluation for appointment: ${data.appointmentId}`, CreateEvaluationUseCase.name);
            const appointmentExists = await this.findAppointmentRepository.findById(data.appointmentId, user);
            if (!appointmentExists) {
                this.logger.warn(`Appointment not found with ID: ${data.appointmentId}`, CreateEvaluationUseCase.name);
                throw new NotFoundException('Appointment not found');
            }

            this.logger.log(`Verifying appointment status for ID: ${data.appointmentId}`, CreateEvaluationUseCase.name);
            if (appointmentExists.status !== AppointmentStatus.COMPLETED) {
                this.logger.warn(`Appointment with ID: ${data.appointmentId} is not completed`, CreateEvaluationUseCase.name);
                throw new BadRequestException('Can only evaluate completed appointments');
            }

            this.logger.log(`Verifying appointment ownership for user ID: ${data.userId}`, CreateEvaluationUseCase.name);
            if (appointmentExists.userId !== data.userId) {
                this.logger.warn(`User with ID: ${data.userId} is not the owner of appointment ID: ${data.appointmentId}`, CreateEvaluationUseCase.name);
                throw new BadRequestException('You can only evaluate your own appointments');
            }

            this.logger.log(`Checking for existing evaluation for appointment ID: ${data.appointmentId}`, CreateEvaluationUseCase.name);
            const existingEvaluation = await this.findEvaluationByIdRepository.findByAppointmentId(data.appointmentId);
            if (existingEvaluation) {
                this.logger.warn(`Appointment with ID: ${data.appointmentId} has already been evaluated`, CreateEvaluationUseCase.name);
                throw new ConflictException('This appointment has already been evaluated');
            }

            this.logger.log(`All validations passed for appointment ID: ${data.appointmentId}, creating evaluation`, CreateEvaluationUseCase.name);
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
