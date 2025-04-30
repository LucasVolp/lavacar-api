import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindScheduleByIdRepository } from "../repository";

@Injectable()
export class FindScheduleByIdUseCase {
    constructor (
        private readonly ScheduleRepository: FindScheduleByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const schedule = await this.ScheduleRepository.findById(id);
            if (!schedule) {
                throw new NotFoundException('Schedule not found!');
            }
            this.logger.log('Schedule found!', FindScheduleByIdUseCase.name);
            return schedule;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding schedule',
                cause: err,
                description: 'Error finding schedule',
            });
            this.logger.error(error.message, err.stack);
            throw error;
        }
    }
}