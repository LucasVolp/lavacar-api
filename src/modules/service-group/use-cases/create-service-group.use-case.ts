import { Injectable, Logger, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceGroupRepository } from "../repository";
import { CreateServiceGroupDto } from "../dto/create-service-group.dto";

@Injectable()
export class CreateServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: CreateServiceGroupRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateServiceGroupDto) {
        try {
            const serviceGroup = await this.serviceGroupRepository.create(data);
            this.logger.log(`ServiceGroup created: ${serviceGroup.name}`, CreateServiceGroupUseCase.name);
            return serviceGroup;
        } catch (err) {
            // Constraint unique (name + shopId)
            if (err?.code === 'P2002') {
                throw new ConflictException('Service group with this name already exists for this shop');
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating service group'
            });
            this.logger.error(error.message, err.stack, CreateServiceGroupUseCase.name);
            throw error;
        }
    }
}
