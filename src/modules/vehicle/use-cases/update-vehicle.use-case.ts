import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindAllVehiclesRepository, FindVehicleByIdRepository, UpdateVehicleRepository } from "../repository";
import { UpdateVehicleDto } from "../dto/update-vehicle.dto";

@Injectable()
export class UpdateVehicleUseCase {
    constructor(
        private readonly VehicleRepository: UpdateVehicleRepository,
        private readonly FindVehicleByIdRepository: FindVehicleByIdRepository,
        private readonly FindAllVehiclesRepository: FindAllVehiclesRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string, data: UpdateVehicleDto) {
        try {
            const vehicleExists = await this.FindVehicleByIdRepository.findById(id);
            if (!vehicleExists) {
                this.logger.error("Vehicle not found!", UpdateVehicleUseCase.name);
                throw new NotFoundException('Vehicle not found!');
            }

            if (data.plate) {
                this.logger.log(`Normalizing plate: ${data.plate}`, UpdateVehicleUseCase.name);
                data.plate = data.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
            }

            const allVehicles = await this.FindAllVehiclesRepository.findAll();
            const plateExists = allVehicles.some(vehicle => vehicle.plate === data.plate && vehicle.id !== id);
            if (plateExists) {
                this.logger.warn(`Vehicle with plate ${data.plate} already exists`, UpdateVehicleUseCase.name);
                throw new ConflictException('Vehicle with this plate already exists for this user');
            }

            const vehicle = await this.VehicleRepository.update(id, data);
            this.logger.log("Vehicle Updated!", UpdateVehicleUseCase.name);
            return vehicle;
        } catch (err) { 
            if (err instanceof NotFoundException || err instanceof ConflictException) {
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