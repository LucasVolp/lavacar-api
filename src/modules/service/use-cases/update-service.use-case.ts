import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceByIdRepository, UpdateServiceRepository } from "../repository";
import { UpdateServiceDto } from "../dto/update-service.dto";
import { FindShopByIdRepository } from "src/modules/shop/repository";
import { FindServiceGroupByIdRepository } from "src/modules/service-group/repository";

@Injectable()
export class UpdateServiceUseCase {
    constructor(
        private readonly ServiceRepository: UpdateServiceRepository,
        private readonly FindServiceRepository: FindServiceByIdRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findServiceGroupByIdRepository: FindServiceGroupByIdRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(id: string, data: UpdateServiceDto) {
        try{
            const serviceExists = await this.FindServiceRepository.findById(id);
            if (!serviceExists) {
                this.logger.error('Service not found', UpdateServiceUseCase.name);
                throw new NotFoundException('Service not found!');
            }

            this.logger.log('Verifying related entities for update', UpdateServiceUseCase.name);
            if (data.shopId) {
                const shopExists = await this.findShopByIdRepository.findById(data.shopId);
                if (!shopExists) {
                    this.logger.error(`Shop not found with ID: ${data.shopId}`, UpdateServiceUseCase.name);
                    throw new NotFoundException('Shop not found');
                }
            }

            this.logger.log('Verifying service group for update', UpdateServiceUseCase.name);
            if (data.groupId) {
                const groupExists = await this.findServiceGroupByIdRepository.findById(data.groupId);
                if (!groupExists) {
                    this.logger.error(`Service group not found with ID: ${data.groupId}`, UpdateServiceUseCase.name);
                    throw new NotFoundException('Service group not found');
                }
            }


            const service = await this.ServiceRepository.update(id, data);
            this.logger.log('Service Updated', UpdateServiceUseCase.name);
            return service;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            // Verificar se é erro de unique constraint (nome duplicado para a mesma shop)
            if (err?.code === 'P2002') {
                throw new ConflictException('Service with this name already exists for this shop');
            }
            
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating Service'
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}