import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { FindAppointmentByIdRepository, UpdateAppointmentRepository } from "../repository";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class UpdateAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: UpdateAppointmentRepository,
        private readonly findByIdRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateAppointmentDto) {
        try {
            const existing = await this.findByIdRepository.findById(id);

            if (!existing) {
                throw new NotFoundException('Appointment not found');
            }

            // Validar transições de status permitidas
            if (data.status) {
                this.validateStatusTransition(existing.status, data.status);
            }

            // Se estiver cancelando, exigir motivo
            if (data.status === AppointmentStatus.CANCELED && !data.cancellationReason) {
                throw new BadRequestException('Cancellation reason is required');
            }

            const appointment = await this.appointmentRepository.update(id, data);
            this.logger.log(`Appointment updated: ${appointment.id}`, UpdateAppointmentUseCase.name);
            return appointment;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating appointment',
            });
            this.logger.error(error.message, err.stack, UpdateAppointmentUseCase.name);
            throw error;
        }
    }

    private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus) {
        const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
            [AppointmentStatus.PENDING]: [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELED,
            ],
            [AppointmentStatus.CONFIRMED]: [
                AppointmentStatus.WAITING,
                AppointmentStatus.CANCELED,
                AppointmentStatus.NO_SHOW,
            ],
            [AppointmentStatus.WAITING]: [
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.CANCELED,
            ],
            [AppointmentStatus.IN_PROGRESS]: [
                AppointmentStatus.COMPLETED,
            ],
            [AppointmentStatus.COMPLETED]: [],
            [AppointmentStatus.CANCELED]: [],
            [AppointmentStatus.NO_SHOW]: [],
        };

        if (!allowedTransitions[currentStatus].includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`
            );
        }
    }
}
