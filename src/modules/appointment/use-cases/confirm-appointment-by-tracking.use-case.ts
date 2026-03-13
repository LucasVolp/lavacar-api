import {
    BadRequestException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from "@nestjs/common";
import { UpdateAppointmentRepository } from "../repository";
import { AuthService } from "src/modules/auth/auth.service";
import { AppointmentStatus } from "prisma/generated";

@Injectable()
export class ConfirmAppointmentByTrackingUseCase {
    constructor(
        private readonly appointmentRepository: UpdateAppointmentRepository,
        private readonly authService: AuthService,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(token: string) {
        try {
            const appointment = await this.authService.validateTrackingToken(token);

            if (appointment.status !== AppointmentStatus.PENDING) {
                throw new BadRequestException(
                    `Não é possível confirmar um agendamento com status "${appointment.status}".`,
                );
            }

            const updated = await this.appointmentRepository.update(appointment.id, {
                status: AppointmentStatus.CONFIRMED,
            });

            this.logger.log(
                `Appointment ${appointment.id} confirmed via tracking token`,
                ConfirmAppointmentByTrackingUseCase.name,
            );

            return updated;
        } catch (err) {
            if (err instanceof BadRequestException) throw err;
            if (err.status) throw err;

            const error = new ServiceUnavailableException("Something bad happened!", {
                cause: err,
                description: "Error confirming appointment by tracking",
            });
            this.logger.error(error.message, err.stack, ConfirmAppointmentByTrackingUseCase.name);
            throw error;
        }
    }
}
