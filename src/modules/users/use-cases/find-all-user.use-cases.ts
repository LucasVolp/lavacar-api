import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllUserRepository } from "../repository";

interface FindAllFilters {
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllUserUseCase {
    constructor(
        private readonly UserRepository: FindAllUserRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}){
        try{
            const result = await this.UserRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} users`, FindAllUserUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding Users'
            })
            this.logger.error(error.message);
            throw err;
        }
    }
}