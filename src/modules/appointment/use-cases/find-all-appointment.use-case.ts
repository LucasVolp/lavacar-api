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
            const parsedFilters = {
                ...filters,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            };

            const appointments = await this.appointmentRepository.findAll(parsedFilters);
            this.logger.log(`Found ${appointments.length} appointments`, FindAllAppointmentUseCase.name);
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
