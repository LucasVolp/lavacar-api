import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceByIdRepository, UpdateServiceRepository } from "../repository";
import { UpdateServiceDto } from "../dto/update-service.dto";

@Injectable()
export class UpdateServiceUseCase {
    constructor(
        private readonly ServiceRepository: UpdateServiceRepository,
        private readonly FindServiceRepository: FindServiceByIdRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(id: string, data: UpdateServiceDto) {
        try{
            const serviceExists = await this.FindServiceRepository.findById(id);
            if (!serviceExists) {
                this.logger.error('Service not found', UpdateServiceUseCase.name);
                throw new NotFoundException('Service not found!');
            }
            const service = await this.ServiceRepository.update(id, data);
            this.logger.log('Service Updated', UpdateServiceUseCase.name);
            return service;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating Service'
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}