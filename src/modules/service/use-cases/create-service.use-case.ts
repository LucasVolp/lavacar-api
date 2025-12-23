import { Injectable, Logger, NotFoundException, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceRepository } from "../repository";
import { CreateServiceDto } from "../dto/create-service.dto";

@Injectable()
export class CreateServiceUseCase {
    constructor(
        private readonly serviceRepository: CreateServiceRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateServiceDto) {
        try {
            const service = await this.serviceRepository.create(data);
            this.logger.log(`Service created: ${service.name}`, CreateServiceUseCase.name);
            return service;
        } catch (err) {
            // Verificar se é erro de constraint unique (name + shopId)
            if (err?.code === 'P2002') {
                throw new ConflictException('Service with this name already exists for this shop');
            }

            // Verificar se é erro de foreign key (shopId ou groupId inválido)
            if (err?.code === 'P2003') {
                const field = err.meta?.field_name || 'reference';
                throw new NotFoundException(`Invalid ${field}: referenced record not found`);
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating Service'
            });
            this.logger.error(error.message, err.stack, CreateServiceUseCase.name);
            throw error;
        }
    }
}