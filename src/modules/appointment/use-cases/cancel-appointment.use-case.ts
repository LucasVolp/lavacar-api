import { 
    BadRequestException, 
    Injectable, 
    Logger, 
    NotFoundException, 
    ServiceUnavailableException 
} from "@nestjs/common";
import { CancelAppointmentRepository, FindAppointmentByIdRepository } from "../repository";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class CancelAppointmentUseCase {
    constructor(
        private readonly cancelRepository: CancelAppointmentRepository,
        private readonly findByIdRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, reason?: string, userId?: string) {
        try {
            const existing = await this.findByIdRepository.findById(id);

            if (!existing) {
                this.logger.warn(`Appointment not found: ${id}`, CancelAppointmentUseCase.name);
                throw new NotFoundException('Appointment not found');
            }
            const nonCancellableStatuses: string[] = [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELED,
                AppointmentStatus.IN_PROGRESS,
            ];

            if (nonCancellableStatuses.includes(existing.status)) {
                this.logger.warn(`Attempt to cancel appointment with status ${existing.status}`, CancelAppointmentUseCase.name);
                throw new BadRequestException(`Cannot cancel appointment with status ${existing.status}`);
            }

            if (userId && existing.userId !== userId) {
                throw new BadRequestException('You can only cancel your own appointments');
            }

            const now = new Date();
            const hoursUntilAppointment = (existing.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilAppointment < 1) {
                throw new BadRequestException('Cannot cancel appointment less than 2 hours before');
            }

            const appointment = await this.cancelRepository.cancel(id, reason);
            this.logger.log(`Appointment canceled: ${appointment.id}`, CancelAppointmentUseCase.name);

            return {
                message: 'Appointment canceled successfully',
                appointment,
            };
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error canceling appointment',
            });
            this.logger.error(error.message, err.stack, CancelAppointmentUseCase.name);
            throw error;
        }
    }
}
