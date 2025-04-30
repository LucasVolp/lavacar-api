import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindScheduleByIdRepository, UpdateScheduleRepository } from "../repository";
import { UpdateScheduleDto } from "../dto/update-schedule.dto";

@Injectable()
export class UpdateScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: UpdateScheduleRepository,
        private readonly FindScheduleByIdRepository: FindScheduleByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateScheduleDto) {
        try {
            const scheduleExists = await this.FindScheduleByIdRepository.findById(id);
            if (!scheduleExists) {
                throw new NotFoundException('Schedule not found!');
            }
            const schedule = await this.ScheduleRepository.update(id, data);
            this.logger.log('Schedule updated!', UpdateScheduleUseCase.name);
            return schedule;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error updating schedule',
                cause: err,
                description: 'Error updating schedule',
            });
            this.logger.error(error.message, err.stack);
            throw error;
        }
    }
}