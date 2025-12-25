import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceGroupByIdRepository } from "../repository";

@Injectable()
export class FindServiceGroupByIdUseCase {
    constructor(
        private readonly serviceGroupRepository: FindServiceGroupByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const serviceGroup = await this.serviceGroupRepository.findById(id);
            
            if (!serviceGroup) {
                this.logger.warn(`Service group not found with ID: ${id}`, FindServiceGroupByIdUseCase.name);
                throw new NotFoundException('Service group not found');
            }

            this.logger.log(`Service group found: ${serviceGroup.name}`, FindServiceGroupByIdUseCase.name);
            return serviceGroup;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding service group'
            });
            this.logger.error(error.message, err.stack, FindServiceGroupByIdUseCase.name);
            throw error;
        }
    }
}
