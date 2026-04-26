import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServiceGroupRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

interface FindAllFilters {
    shopId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllServiceGroupUseCase {
    constructor(
        private readonly serviceGroupRepository: FindAllServiceGroupRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}, user: JwtPayload) {
        try {
            const result = await this.serviceGroupRepository.findAll(filters, user);
            this.logger.log(`Found ${result.meta.total} service groups`, FindAllServiceGroupUseCase.name);
            return result;
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
