import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllVehiclesRepository } from "../repository";

interface FindAllFilters {
    userId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllVehiclesUseCase {
    constructor(
        private readonly VehicleRepository: FindAllVehiclesRepository,
        private readonly logger: Logger = new Logger()        
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.VehicleRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} vehicles`, FindAllVehiclesUseCase.name);
            return result;
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