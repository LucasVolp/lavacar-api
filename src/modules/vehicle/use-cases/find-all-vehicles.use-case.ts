import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllVehiclesRepository } from "../repository";

@Injectable()
export class FindAllVehiclesUseCase {
    constructor(
        private readonly VehicleRepository: FindAllVehiclesRepository,
        private readonly logger: Logger = new Logger()        
    ) {}

    async execute() {
        try {
            const vehicles = await this.VehicleRepository.findAll();
            this.logger.log("Vehicles Found!", FindAllVehiclesUseCase.name);
            return vehicles;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding vehicles',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}