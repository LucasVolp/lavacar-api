import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindVehicleByIdRepository } from "../repository";

@Injectable()
export class FindVehicleByIdUseCase {
    constructor(
        private readonly VehicleRepository: FindVehicleByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const vehicle = await this.VehicleRepository.findById(id);
            if (!vehicle) {
                this.logger.log("Vehicle not found.", FindVehicleByIdUseCase.name);
                throw new NotFoundException('Vehicle not found!');
            }
            this.logger.log("Vehicle Found!", FindVehicleByIdUseCase.name);
            return vehicle;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding vehicle',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}