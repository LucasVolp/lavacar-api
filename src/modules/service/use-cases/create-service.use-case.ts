import { Injectable, Logger, NotFoundException, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceRepository } from "../repository";
import { CreateServiceDto } from "../dto/create-service.dto";
import { FindShopByIdRepository } from "src/modules/shop/repository";
import { FindServiceGroupByIdRepository } from "src/modules/service-group/repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class CreateServiceUseCase {
    constructor(
        private readonly serviceRepository: CreateServiceRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findServiceGroupByIdRepository: FindServiceGroupByIdRepository,
        private readonly prisma: PrismaService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateServiceDto, user: JwtPayload) {
        try {
            await buildShopScope(this.prisma, user, data.shopId);
            this.logger.log(`Verifying existence of shop with ID: ${data.shopId}`, CreateServiceUseCase.name);
            const shopExists = await this.findShopByIdRepository.findById(data.shopId);
            if (!shopExists) {
                this.logger.warn(`Shop not found with ID: ${data.shopId}`, CreateServiceUseCase.name);
                throw new NotFoundException('Shop not found');
            }

            this.logger.log(`Creating service with name: ${data.name} for shop ID: ${data.shopId}`, CreateServiceUseCase.name);
            if (data.groupId) {
                const groupExists = await this.findServiceGroupByIdRepository.findById(data.groupId);
                if (!groupExists) {
                    this.logger.warn(`Service group not found with ID: ${data.groupId}`, CreateServiceUseCase.name);
                    throw new NotFoundException('Service group not found');
                }
            }

            const service = await this.serviceRepository.create(data);
            this.logger.log(`Service created with ID: ${service.id}`, CreateServiceUseCase.name);
            return service;

        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            // Verificar se é erro de conflito (nome duplicado para a mesma shop)
            if (err?.code === 'P2002') {
                throw new ConflictException('Service with this name already exists for this shop');
            }

            // Verificar se é erro de foreign key (shopId ou groupId inválido)
            if (err?.code === 'P2003') {
                const field = err.meta?.field_name || 'reference';
                throw new NotFoundException(`Invalid ${field}: referenced record not found`);
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating Service'
            });
            this.logger.error(error.message, err.stack, CreateServiceUseCase.name);
            throw error;
        }
    }
}
