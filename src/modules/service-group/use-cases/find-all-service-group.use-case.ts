import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServiceGroupRepository } from "../repository";

@Injectable()
export class FindAllServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: FindAllServiceGroupRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(shopId?: string) {
        try {
            const serviceGroups = await this.serviceGroupRepository.findAll(shopId);
            this.logger.log(`Found ${serviceGroups.length} service groups`, FindAllServiceGroupUseCase.name);
            return serviceGroups;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding service groups'
            });
            this.logger.error(error.message, err.stack, FindAllServiceGroupUseCase.name);
            throw error;
        }
    }
}
