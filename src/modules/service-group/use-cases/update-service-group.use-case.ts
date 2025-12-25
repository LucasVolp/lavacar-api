import { Injectable, Logger, NotFoundException, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceGroupByIdRepository, UpdateServiceGroupRepository } from "../repository";
import { UpdateServiceGroupDto } from "../dto/update-service-group.dto";

@Injectable()
export class UpdateServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: UpdateServiceGroupRepository,
        private readonly findByIdRepository: FindServiceGroupByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateServiceGroupDto) {
        try {
            const serviceGroupExists = await this.findByIdRepository.findById(id);
            
            if (!serviceGroupExists) {
                throw new NotFoundException('Service group not found');
            }

            const serviceGroup = await this.serviceGroupRepository.update(id, data);
            this.logger.log(`Service group updated: ${serviceGroup.name}`, UpdateServiceGroupUseCase.name);
            return serviceGroup;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            if (err?.code === 'P2002') {
                throw new ConflictException('Service group with this name already exists for this shop');
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating service group'
            });
            this.logger.error(error.message, err.stack, UpdateServiceGroupUseCase.name);
            throw error;
        }
    }
}
