import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindScheduleByIdRepository, UpdateScheduleRepository } from "../repository";
import { UpdateScheduleDto } from "../dto/update-schedule.dto";
import { timeToMinutes } from "src/shared/utils";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class UpdateScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: UpdateScheduleRepository,
        private readonly FindScheduleByIdRepository: FindScheduleByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, data: UpdateScheduleDto, user: JwtPayload) {
        try {
            const schedule = await this.FindScheduleByIdRepository.findById(id, user);
            if (!schedule) {
                this.logger.warn(`Schedule with id ${id} not found`, UpdateScheduleUseCase.name);
                throw new NotFoundException('Schedule not found!');
            }

            const finalStartTime = data.startTime ?? schedule.startTime;
            const finalEndTime = data.endTime ?? schedule.endTime;

            const startMinutes = timeToMinutes(finalStartTime);
            const endMinutes = timeToMinutes(finalEndTime);

            if (startMinutes >= endMinutes) {
                this.logger.warn('startTime must be before endTime', UpdateScheduleUseCase.name);
                throw new BadRequestException('startTime must be before endTime');
            }

            const finalBreakStart = data.breakStartTime ?? schedule.breakStartTime;
            const finalBreakEnd = data.breakEndTime ?? schedule.breakEndTime;

            if (finalBreakStart && finalBreakEnd) {
                const breakStartMinutes = timeToMinutes(finalBreakStart);
                const breakEndMinutes = timeToMinutes(finalBreakEnd);

                if (breakStartMinutes >= breakEndMinutes) {
                    throw new BadRequestException('breakStartTime must be before breakEndTime');
                }

                if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                    throw new BadRequestException('Break time must be within working hours');
                }
            }

            const scheduleUpdated = await this.ScheduleRepository.update(id, data);
            this.logger.log('Schedule updated!', UpdateScheduleUseCase.name);
            return scheduleUpdated;
        } catch (err) {
            if (err instanceof BadRequestException || 
                err instanceof NotFoundException) {
                throw err;
            }
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
