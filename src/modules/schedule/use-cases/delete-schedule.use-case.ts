import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteScheduleRepository, FindScheduleByIdRepository } from "../repository";

@Injectable()
export class DeleteScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: DeleteScheduleRepository,
        private readonly FindScheduleByIdRepository: FindScheduleByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const scheduleExists = await this.FindScheduleByIdRepository.findById(id);
            if (!scheduleExists) {
                throw new NotFoundException('Schedule not found!');
            }
            const schedule = await this.ScheduleRepository.delete(id);
            this.logger.log('Schedule deleted!', DeleteScheduleUseCase.name);
            return schedule;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error deleting schedule',
                cause: err,
                description: 'Error deleting schedule',
            });
            this.logger.error(error.message, err.stack);
            throw error;
        } 
    }
}