import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindVehicleByIdRepository, UpdateVehicleRepository } from "../repository";
import { UpdateVehicleDto } from "../dto/update-vehicle.dto";

@Injectable()
export class UpdateVehicleUseCase {
    constructor(
        private readonly VehicleRepository: UpdateVehicleRepository,
        private readonly FindVehicleByIdRepository: FindVehicleByIdRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string, data: UpdateVehicleDto) {
        try {
            const vehicleExists = await this.FindVehicleByIdRepository.findById(id);
            if (!vehicleExists) {
                this.logger.error("Vehicle not found!", UpdateVehicleUseCase.name);
                throw new NotFoundException('Vehicle not found!');
            }
            const vehicle = await this.VehicleRepository.update(id, data);
            this.logger.log("Vehicle Updated!", UpdateVehicleUseCase.name);
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