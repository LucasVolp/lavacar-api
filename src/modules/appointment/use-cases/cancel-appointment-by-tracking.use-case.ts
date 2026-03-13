import {
    BadRequestException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from "@nestjs/common";
import { CancelAppointmentRepository } from "../repository";
import { AuthService } from "src/modules/auth/auth.service";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class CancelAppointmentByTrackingUseCase {
    constructor(
        private readonly cancelRepository: CancelAppointmentRepository,
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(token: string, reason?: string) {
        try {
            const appointment = await this.authService.validateTrackingToken(token);

            if (appointment.status !== AppointmentStatus.PENDING) {
                throw new BadRequestException(
                    `Não é possível cancelar um agendamento com status "${appointment.status}".`,
                );
            }

            const updated = await this.cancelRepository.cancel(appointment.id, reason);

            this.logger.log(
                `Appointment ${appointment.id} canceled via tracking token`,
                CancelAppointmentByTrackingUseCase.name,
            );

            return updated;
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            if (err.status) throw err;

            const error = new ServiceUnavailableException("Something bad happened!", {
                cause: err,
                description: "Error canceling appointment by tracking",
            });
            this.logger.error(error.message, err.stack, CancelAppointmentByTrackingUseCase.name);
            throw error;
        }
    }
}
