import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllScheduleRepository } from "../repository";

interface FindAllFilters {
    shopId?: string;
    page?: number;
    perPage?: number;
}

@Injectable()
export class FindAllScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: FindAllScheduleRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(filters: FindAllFilters = {}) {
        try {
            const result = await this.ScheduleRepository.findAll(filters);
            this.logger.log(`Found ${result.meta.total} schedules`, FindAllScheduleUseCase.name);
            return result;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding schedules',
                cause: err,
                description: 'Error finding schedules',
            });
            this.logger.error(error.message, err.stack);
            throw error;
        }
    } 
}