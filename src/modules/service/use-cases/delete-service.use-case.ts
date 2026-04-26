import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteServiceRepository, FindServiceByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class DeleteServiceUseCase {
    constructor(
        private readonly ServiceRepository: DeleteServiceRepository,
        private readonly FindServiceRepository: FindServiceByIdRepository,
        private readonly logger: Logger = new Logger(),
    ){}

    async execute(id: string, user: JwtPayload) {
        try{
            const serviceExists = await this.FindServiceRepository.findById(id, user);
            if (!serviceExists) {
                this.logger.error('Service not found', DeleteServiceUseCase.name);
                throw new NotFoundException('Service not found!');
            }
            const service = await this.ServiceRepository.delete(id);
            this.logger.log('Service Deleted', DeleteServiceUseCase.name);
            return service;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting Service'
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
