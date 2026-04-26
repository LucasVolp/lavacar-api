import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllScheduleRepository } from "../repository";

@Injectable()
export class FindPublicSchedulesUseCase {
    constructor(
        private readonly scheduleRepository: FindAllScheduleRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(shopId: string) {
        try {
            const schedules = await this.scheduleRepository.findPublicByShopId(shopId);
            this.logger.log(`Found ${schedules.length} public schedules`, FindPublicSchedulesUseCase.name);
            return schedules;
        } catch (err) {
            const error = new ServiceUnavailableException({
                message: 'Error finding public schedules',
                cause: err,
                description: 'Error finding public schedules',
            });
            this.logger.error(error.message, err.stack, FindPublicSchedulesUseCase.name);
            throw error;
        }
    }
}
