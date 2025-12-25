import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServicesRepository } from "../repository";

@Injectable()
export class FindAllServicesUseCase{
    constructor(
        private readonly ServiceRepository: FindAllServicesRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(){
        try {
            const services = await this.ServiceRepository.findAll();
            if (services.length === 0){
                this.logger.warn('No Services found', FindAllServicesUseCase.name);
                return [];
            }

            this.logger.log('Services Found', FindAllServicesUseCase.name);
            return services;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding Services'
            });
            this.logger.error(error.message);
            throw error;
        }  
    }
}