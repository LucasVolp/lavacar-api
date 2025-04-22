import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceByIdRepository } from "../repository";

@Injectable()
export class FindServiceByIdUseCase {
    constructor(
        private readonly ServiceRepository: FindServiceByIdRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(id: string) {
        try {
            const service = await this.ServiceRepository.findById(id);
            if (!service) {
                throw new NotFoundException('Service not found!');
            }
            this.logger.log('Service Found', FindServiceByIdUseCase.name);
            return service;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'O grêmio é minusculo!'
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}