import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServicesRepository } from "../repository";
import { FilterServiceDto } from "../dto/filter-service.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class FindAllServicesUseCase{
    constructor(
        private readonly ServiceRepository: FindAllServicesRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(filters: FilterServiceDto = {}, user: JwtPayload){
        try {
            const result = await this.ServiceRepository.findAll(filters, user);
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

    async executePublic(filters: FilterServiceDto = {}) {
        try {
            const result = await this.ServiceRepository.findPublic(filters);
            this.logger.log(`Found ${result.meta.total} public services`, FindAllServicesUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding public services'
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
