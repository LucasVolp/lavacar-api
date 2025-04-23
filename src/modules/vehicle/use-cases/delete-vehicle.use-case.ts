import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { DeleteVehicleRepository, FindVehicleByIdRepository } from "../repository";

@Injectable()
export class DeleteVehicleUseCase {
    constructor(
        private readonly VehicleRepository: DeleteVehicleRepository,
        private readonly FindVehicleByIdRepository: FindVehicleByIdRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string) {
        try {
            const vehicleExists = await this.FindVehicleByIdRepository.findById(id);
            if (!vehicleExists) {
                this.logger.error("Vehicle not found!", DeleteVehicleUseCase.name);
                throw new Error('Vehicle not found!');
            }
            const vehicle = await this.VehicleRepository.delete(id);
            this.logger.log("Vehicle Deleted!", DeleteVehicleUseCase.name);
            return vehicle;

       } catch (err) { 
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding vehicle',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}