import { ConflictException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { createScheduleRepository, FindAllScheduleRepository, FindScheduleByWeekdayRepository } from "../repository";
import { CreateScheduleDto } from "../dto/create-schedule.dto";
import { Weekday } from "../types/Weekday";

@Injectable()
export class CreateScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: createScheduleRepository, 
        private readonly findScheduleByWeekDayRepository: FindScheduleByWeekdayRepository,       
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateScheduleDto) {
        try {
            const scheduleWeekdayExists = await this.findScheduleByWeekDayRepository.findScheduleByWeekday(data.weekday);
            
            if (scheduleWeekdayExists) {
                this.logger.error('Schedule already exists for this weekday', CreateScheduleUseCase.name);
                const error = new ConflictException('Schedule already exists for this weekday');
                throw error;
            }

            const schedule = await this.ScheduleRepository.create(data);
            this.logger.log('Schedule created!', CreateScheduleUseCase.name);
            return schedule;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error creating schedule',
                cause: err,
                description: 'Error creating schedule',
            });
            this.logger.error(error.message, err.stack);
            throw error;
        }
    }
}