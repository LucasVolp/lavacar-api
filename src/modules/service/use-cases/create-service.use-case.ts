import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceRepository } from "../repository";
import { CreateServiceDto } from "../dto/create-service.dto";

@Injectable()
export class CreateServiceUseCase{
    constructor(
        private readonly ServiceRepository: CreateServiceRepository,
        private readonly logger: Logger = new Logger
    ){}

    async execute(data: CreateServiceDto){
        try {
            const service = await this.ServiceRepository.create(data);
            this.logger.log('Service Created', CreateServiceUseCase.name);
            return service;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating Service'
            });
            this.logger.error(error.message);
            throw error;
        }    
    }
}