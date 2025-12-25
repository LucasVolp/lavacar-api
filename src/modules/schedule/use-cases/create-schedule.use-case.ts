import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { createScheduleRepository, FindScheduleByWeekdayRepository } from "../repository";
import { CreateScheduleDto } from "../dto/create-schedule.dto";
import { timeToMinutes } from "src/shared/utils";

@Injectable()
export class CreateScheduleUseCase {
    constructor (
        private readonly scheduleRepository: createScheduleRepository, 
        private readonly findScheduleByWeekDayRepository: FindScheduleByWeekdayRepository,       
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateScheduleDto) {
        try {
            // Validar que endTime > startTime
            this.logger.log('Validating schedule times', CreateScheduleUseCase.name);
            const startMinutes = timeToMinutes(data.startTime);
            const endMinutes = timeToMinutes(data.endTime);

            if (endMinutes <= startMinutes) {
                this.logger.warn('endTime must be after startTime', CreateScheduleUseCase.name);
                throw new BadRequestException('endTime must be after startTime');
            }

            // Validar break times se fornecidos
            if (data.breakStartTime && data.breakEndTime) {
                const breakStart = timeToMinutes(data.breakStartTime);
                const breakEnd = timeToMinutes(data.breakEndTime);

                if (breakEnd <= breakStart) {
                    this.logger.warn('breakEndTime must be after breakStartTime', CreateScheduleUseCase.name);
                    throw new BadRequestException('breakEndTime must be after breakStartTime');
                }

                if (breakStart < startMinutes || breakEnd > endMinutes) {
                    this.logger.warn('Break time must be within working hours', CreateScheduleUseCase.name);
                    throw new BadRequestException('Break time must be within working hours');
                }
            } else if (data.breakStartTime && !data.breakEndTime) {
                this.logger.warn('breakEndTime is required when breakStartTime is provided', CreateScheduleUseCase.name);
                throw new BadRequestException('breakEndTime is required when breakStartTime is provided');
            }

            // Verificar se já existe schedule para este dia/loja
            const scheduleExists = await this.findScheduleByWeekDayRepository.findScheduleByWeekday(
                data.weekday,
                data.shopId
            );
            
            if (scheduleExists) {
                this.logger.warn(`Schedule already exists for weekday: ${data.weekday}`, CreateScheduleUseCase.name);
                throw new ConflictException('Schedule already exists for this weekday');
            }

            const schedule = await this.scheduleRepository.create(data);
            this.logger.log(`Schedule created for ${data.weekday}`, CreateScheduleUseCase.name);
            return schedule;
        } catch (err) {
            if (err instanceof BadRequestException || 
                err instanceof ConflictException || 
                err instanceof NotFoundException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating schedule',
            });
            this.logger.error(error.message, err.stack, CreateScheduleUseCase.name);
            throw error;
        }
    }
}