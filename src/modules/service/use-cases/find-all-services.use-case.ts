import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServicesRepository } from "../repository";
import { FilterServiceDto } from "../dto/filter-service.dto";

@Injectable()
export class FindAllServicesUseCase{
    constructor(
        private readonly ServiceRepository: FindAllServicesRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(filters: FilterServiceDto = {}){
        try {
            const result = await this.ServiceRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} services`, FindAllServicesUseCase.name);
            return result;
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