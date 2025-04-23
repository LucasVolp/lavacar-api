import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateVehicleDto } from "../dto/create-vehicle.dto";
import { CreateVehicleRepository } from "../repository";

@Injectable()
export class CreateVehicleUseCase {
    constructor(
        private readonly VehicleRepository: CreateVehicleRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateVehicleDto) {
        try {
            const vehicle = await this.VehicleRepository.create(data);
            this.logger.log("Vehicle Created!", CreateVehicleUseCase.name);
            return vehicle;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating vehicle',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}