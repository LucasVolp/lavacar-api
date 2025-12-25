import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllScheduleRepository } from "../repository";

@Injectable()
export class FindAllScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: FindAllScheduleRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute() {
        try {
            const schedules = await this.ScheduleRepository.findAll();
            if (!schedules) {
                this.logger.warn('No schedules found', FindAllScheduleUseCase.name);
                return [];
            }
            this.logger.log('Schedules found!', FindAllScheduleUseCase.name);
            return schedules;
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