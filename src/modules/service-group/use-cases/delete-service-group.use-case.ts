import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteServiceGroupRepository, FindServiceGroupByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class DeleteServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: DeleteServiceGroupRepository,
        private readonly findByIdRepository: FindServiceGroupByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, user: JwtPayload) {
        try {
            const serviceGroupExists = await this.findByIdRepository.findById(id, user);
            
            if (!serviceGroupExists) {
                this.logger.warn(`Service group not found with ID: ${id}`, DeleteServiceGroupUseCase.name);
                throw new NotFoundException('Service group not found');
            }

            await this.serviceGroupRepository.delete(id);
            this.logger.log(`Service group deleted: ${id}`, DeleteServiceGroupUseCase.name);
            return { message: 'Service group deleted successfully' };
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting service group'
            });
            this.logger.error(error.message, err.stack, DeleteServiceGroupUseCase.name);
            throw error;
        }
    }
}
