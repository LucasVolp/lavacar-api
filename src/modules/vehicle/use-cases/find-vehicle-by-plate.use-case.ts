import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindVehicleByPlateRepository } from "../repository";

@Injectable()
export class FindVehicleByPlateUseCase {
    constructor(
        private readonly VehicleRepository: FindVehicleByPlateRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(plate: string) {
        try {
            const sanitized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
            this.logger.log(`Searching for vehicle with plate (raw): ${plate}, (sanitized): ${sanitized}`, FindVehicleByPlateUseCase.name);
            const vehicle = await this.VehicleRepository.findByPlate(sanitized);
            if (!vehicle) {
                this.logger.log(`No vehicle found for plate: ${sanitized}`, FindVehicleByPlateUseCase.name);
                return null;
            }
            this.logger.log(`Vehicle found for plate: ${sanitized}`, FindVehicleByPlateUseCase.name);
            return vehicle;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding vehicle by plate',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
