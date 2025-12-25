import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceGroupRepository } from "../repository";
import { CreateServiceGroupDto } from "../dto/create-service-group.dto";
import { FindShopByIdRepository } from "src/modules/shop/repository";

@Injectable()
export class CreateServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: CreateServiceGroupRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateServiceGroupDto) {
        try {
            const shopExists = await this.findShopByIdRepository.findById(data.shopId);
            if (!shopExists) {
                this.logger.warn(`Shop not found with ID: ${data.shopId}`, CreateServiceGroupUseCase.name);
                throw new NotFoundException('Shop not found for creating service group');
            }
            const serviceGroup = await this.serviceGroupRepository.create(data);
            this.logger.log(`Service group created with ID: ${serviceGroup.id}`, CreateServiceGroupUseCase.name);
            return serviceGroup;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
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
