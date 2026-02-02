import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllAppointmentRepository } from "../repository";
import { FindAllFilters } from "../dto/filters-appointment.dto";

@Injectable()
export class FindAllAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: FindAllAppointmentRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            // Parse startDate para início do dia (00:00:00)
            let startDate: Date | undefined;
            if (filters.startDate) {
                startDate = new Date(filters.startDate);
                startDate.setUTCHours(0, 0, 0, 0);
            }

            // Parse endDate para final do dia (23:59:59.999)
            let endDate: Date | undefined;
            if (filters.endDate) {
                endDate = new Date(filters.endDate);
                endDate.setUTCHours(23, 59, 59, 999);
            }

            const parsedFilters = {
                ...filters,
                startDate,
                endDate,
            };

            const appointments = await this.appointmentRepository.findAll(parsedFilters);
            this.logger.log(`Found ${appointments.length} appointments`, FindAllAppointmentUseCase.name);
            return appointments;
            return appointments;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding appointments',
            });
            this.logger.error(error.message, err.stack, FindAllAppointmentUseCase.name);
            throw error;
        }
    }
}
