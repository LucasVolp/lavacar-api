import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindAppointmentByIdRepository } from "../repository";

@Injectable()
export class FindAppointmentByIdUseCase {
    constructor(
        private readonly appointmentRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const appointment = await this.appointmentRepository.findById(id);

            if (!appointment) {
                this.logger.warn(`Appointment not found with ID: ${id}`, FindAppointmentByIdUseCase.name);
                throw new NotFoundException('Appointment not found');
            }

            this.logger.log(`Appointment found: ${appointment.id}`, FindAppointmentByIdUseCase.name);
            return appointment;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding appointment',
            });
            this.logger.error(error.message, err.stack, FindAppointmentByIdUseCase.name);
            throw error;
        }
    }
}
