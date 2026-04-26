import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAppointmentsByDateRepository } from "../repository";

@Injectable()
export class FindPublicAppointmentsByDateUseCase {
    constructor(
        private readonly findAppointmentsByDateRepository: FindAppointmentsByDateRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(shopId: string, date: Date) {
        try {
            const appointments = await this.findAppointmentsByDateRepository.findByShopAndDate(shopId, date);
            this.logger.log(`Found ${appointments.length} public appointments by date`, FindPublicAppointmentsByDateUseCase.name);
            return appointments;
        } catch (err) {
            const error = new ServiceUnavailableException('Error finding public appointments by date', {
                cause: err,
                description: 'Error finding public appointments by date',
            });
            this.logger.error(error.message, err.stack, FindPublicAppointmentsByDateUseCase.name);
            throw error;
        }
    }
}
