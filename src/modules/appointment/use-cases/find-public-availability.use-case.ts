import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateAppointmentUseCase } from "./create-appointment.use-case";

@Injectable()
export class FindPublicAvailabilityUseCase {
    constructor(
        private readonly createAppointmentUseCase: CreateAppointmentUseCase,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(params: { shopId: string; date: string; serviceIds: string[] }) {
        try {
            return await this.createAppointmentUseCase.getPublicAvailableSlots(params);
        } catch (err) {
            const error = new ServiceUnavailableException('Error finding public availability', {
                cause: err,
                description: 'Error finding public availability',
            });
            this.logger.error(error.message, err.stack, FindPublicAvailabilityUseCase.name);
            throw error;
        }
    }
}
