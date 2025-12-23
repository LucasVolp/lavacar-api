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
                throw new NotFoundException('Appointment not found');
            }

            // Verificar se o agendamento pode ser cancelado
            const nonCancellableStatuses: string[] = [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELED,
                AppointmentStatus.IN_PROGRESS,
            ];

            if (nonCancellableStatuses.includes(existing.status)) {
                throw new BadRequestException(`Cannot cancel appointment with status ${existing.status}`);
            }

            // Se for o cliente cancelando, verificar se é dele
            if (userId && existing.userId !== userId) {
                throw new BadRequestException('You can only cancel your own appointments');
            }

            // Verificar política de cancelamento (ex: até 2h antes)
            const now = new Date();
            const hoursUntilAppointment = (existing.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilAppointment < 2) {
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
