import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateBlockedTimeDto } from '../dto/create-blocked-time.dto';
import { CreateBlockedTimeRepository } from '../repository';
import { timeToMinutes } from 'src/shared/utils';

@Injectable()
export class CreateBlockedTimeUseCase {
    constructor(
        private readonly blockedTimeRepository: CreateBlockedTimeRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateBlockedTimeDto) {
        try {
            // Validar que endTime > startTime se for PARTIAL
            if (data.type === 'PARTIAL' && data.startTime && data.endTime) {
                const startMinutes = timeToMinutes(data.startTime);
                const endMinutes = timeToMinutes(data.endTime);

                if (endMinutes <= startMinutes) {
                    throw new BadRequestException('endTime must be after startTime');
                }
            }

            // Validar que a data não é no passado
            const blockedDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (blockedDate < today) {
                throw new BadRequestException('Cannot block a date in the past');
            }

            const blockedTime = await this.blockedTimeRepository.create({
                ...data,
                date: blockedDate,
            });

            this.logger.log(`Blocked time created for ${data.date}`, CreateBlockedTimeUseCase.name);
            return blockedTime;
        } catch (err) {
            if (err instanceof BadRequestException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating blocked time',
            });
            this.logger.error(error.message, err.stack, CreateBlockedTimeUseCase.name);
            throw error;
        }
    }
}
