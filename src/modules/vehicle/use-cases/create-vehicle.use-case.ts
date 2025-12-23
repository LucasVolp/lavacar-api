import { Injectable, Logger, ConflictException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateVehicleDto } from "../dto/create-vehicle.dto";
import { CreateVehicleRepository } from "../repository";

@Injectable()
export class CreateVehicleUseCase {
    constructor(
        private readonly vehicleRepository: CreateVehicleRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateVehicleDto) {
        try {
            // Normalizar placa para uppercase
            const normalizedData = {
                ...data,
                plate: data.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            };

            const vehicle = await this.vehicleRepository.create(normalizedData);
            this.logger.log(`Vehicle created: ${vehicle.plate}`, CreateVehicleUseCase.name);
            return vehicle;
        } catch (err) {
            // Placa já cadastrada para este usuário
            if (err?.code === 'P2002') {
                throw new ConflictException('Vehicle with this plate already exists for this user');
            }

            // Usuário não encontrado
            if (err?.code === 'P2003') {
                throw new NotFoundException('User not found');
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating vehicle',
            });
            this.logger.error(error.message, err.stack, CreateVehicleUseCase.name);
            throw error;
        }
    }
}