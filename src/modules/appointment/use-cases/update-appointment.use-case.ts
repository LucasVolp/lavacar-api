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
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class UpdateAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: UpdateAppointmentRepository,
        private readonly findByIdRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateAppointmentDto, user: JwtPayload) {
        try {
            const existing = await this.findByIdRepository.findById(id, user);

            if (!existing) {
                this.logger.warn(`Appointment not found with ID: ${id}`, UpdateAppointmentUseCase.name);
                throw new NotFoundException('Appointment not found');
            }

            // Validar transições de status permitidas
            if (data.status) {
                this.validateStatusTransition(existing.status, data.status);
            }

            // Se estiver cancelando, exigir motivo
            if (data.status === AppointmentStatus.CANCELED && !data.cancellationReason) {
                this.logger.warn(`Cancellation reason required for appointment ID: ${id}`, UpdateAppointmentUseCase.name);
                throw new BadRequestException('Cancellation reason is required');
            }

            const updateData: any = { ...data };

            // Side Effect: Atualizar endTime ao completar
            if (data.status === AppointmentStatus.COMPLETED) {
                updateData.endTime = new Date();
            }

            const appointment = await this.appointmentRepository.update(id, updateData);
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
        // Atalhos permitidos para agilidade operacional (Walk-in, etc)
        const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
            [AppointmentStatus.PENDING]: [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELED,
                AppointmentStatus.WAITING,
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.COMPLETED,
            ],
            [AppointmentStatus.CONFIRMED]: [
                AppointmentStatus.WAITING,
                AppointmentStatus.CANCELED,
                AppointmentStatus.NO_SHOW,
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.COMPLETED,
            ],
            [AppointmentStatus.WAITING]: [
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.CANCELED,
                AppointmentStatus.COMPLETED,
            ],
            [AppointmentStatus.IN_PROGRESS]: [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELED,
            ],
            [AppointmentStatus.COMPLETED]: [], // Terminal
            [AppointmentStatus.CANCELED]: [], // Terminal
            [AppointmentStatus.NO_SHOW]: [], // Terminal
        };

        if (!allowedTransitions[currentStatus].includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`
            );
        }
    }
}
