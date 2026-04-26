import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAppointmentsByVehiclePlateRepository } from '../repository/find-appointments-by-vehicle-plate.repository';

@Injectable()
export class FindAppointmentsByVehiclePlateUseCase {
    constructor(
        private readonly appointmentRepository: FindAppointmentsByVehiclePlateRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(plate: string, shopId: string) {
        try {
            const result = await this.appointmentRepository.findUpcomingByPlateAndShop(plate, shopId);
            
            if (!result || result.length === 0) {
                this.logger.warn(`No upcoming appointments found for plate ${plate} in shop ${shopId}`, FindAppointmentsByVehiclePlateUseCase.name);
                return [];
            }

            this.logger.log(
                `Found ${result.length} upcoming appointments for plate ${plate} in shop ${shopId}`,
                FindAppointmentsByVehiclePlateUseCase.name,
            );
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something went wrong while fetching appointments by vehicle plate');
            this.logger.error(`Error fetching appointments for plate ${plate} in shop ${shopId}: ${err.message}`, err.stack, FindAppointmentsByVehiclePlateUseCase.name);
            throw error;
        }

    }
}
