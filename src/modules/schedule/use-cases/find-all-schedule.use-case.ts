import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
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
                throw new NotFoundException('Schedules not found!');
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