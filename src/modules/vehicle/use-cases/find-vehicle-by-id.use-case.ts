import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
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
            this.logger.log("Vehicle Found!", FindVehicleByIdUseCase.name);
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