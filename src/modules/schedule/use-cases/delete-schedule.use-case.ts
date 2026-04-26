import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteScheduleRepository, FindScheduleByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class DeleteScheduleUseCase {
    constructor (
        private readonly ScheduleRepository: DeleteScheduleRepository,
        private readonly FindScheduleByIdRepository: FindScheduleByIdRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string, user: JwtPayload) {
        try {
            const scheduleExists = await this.FindScheduleByIdRepository.findById(id, user);
            if (!scheduleExists) {
                this.logger.warn(`Schedule with id ${id} not found`, DeleteScheduleUseCase.name);
                throw new NotFoundException('Schedule not found!');
            }
            const schedule = await this.ScheduleRepository.delete(id);
            this.logger.log('Schedule deleted!', DeleteScheduleUseCase.name);
            return schedule;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
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
