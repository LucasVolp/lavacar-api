import { Injectable, Logger, ConflictException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateVehicleDto } from "../dto/create-vehicle.dto";
import { CreateVehicleRepository, FindAllVehiclesRepository } from "../repository";
import { FindUserRepository } from "src/modules/users/repository";

@Injectable()
export class CreateVehicleUseCase {
    constructor(
        private readonly vehicleRepository: CreateVehicleRepository,
        private readonly findUserRepository: FindUserRepository,
        private readonly findVehicleRepository: FindAllVehiclesRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateVehicleDto) {
        try {
            this.logger.log(`Creating vehicle with plate: ${data.plate}`, CreateVehicleUseCase.name);
            const normalizedData = {
                ...data,
                plate: data.plate || ''.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            };

            const userExists = await this.findUserRepository.findById(normalizedData.userId);
            if (!userExists) {
                this.logger.warn(`User not found with ID: ${normalizedData.userId}`, CreateVehicleUseCase.name);
                throw new NotFoundException('User not found');
            };

            const vehiclesResult = await this.findVehicleRepository.findAll({ perPage: 10000 });
            const plateExists = vehiclesResult.data.some(vehicle => vehicle.plate === normalizedData.plate);
            if (plateExists) {
                this.logger.warn(`Vehicle with plate ${normalizedData.plate} already exists`, CreateVehicleUseCase.name);
                throw new ConflictException('Vehicle with this plate already exists for this user');
            };

            const vehicle = await this.vehicleRepository.create(normalizedData);
            this.logger.log(`Vehicle created: ${vehicle.plate}`, CreateVehicleUseCase.name);
            return vehicle;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof ConflictException) {
                throw err;
            };
            
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating vehicle',
            });
            this.logger.error(error.message, err.stack, CreateVehicleUseCase.name);
            throw error;
        }
    }
}