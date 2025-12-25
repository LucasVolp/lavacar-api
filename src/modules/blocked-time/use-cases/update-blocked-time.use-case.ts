import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateBlockedTimeRepository, FindBlockedTimeByIdRepository } from '../repository';
import { UpdateBlockedTimeDto } from '../dto/update-blocked-time.dto';
import { BlockedTimeType } from '../types/BlockedTimeType';
import { timeToMinutes } from 'src/shared/utils';

@Injectable()
export class UpdateBlockedTimeUseCase {
  constructor(
    private readonly blockedTimeRepository: UpdateBlockedTimeRepository,
    private readonly findBlockedTimeByIdRepository: FindBlockedTimeByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateBlockedTimeDto) {
    try {
      const exists = await this.findBlockedTimeByIdRepository.findById(id);
      if (!exists) {
        this.logger.warn(`Blocked time not found with ID: ${id}`, UpdateBlockedTimeUseCase.name);
        throw new NotFoundException('Blocked time not found!');
      }

      if (data.type === BlockedTimeType.PARTIAL && data.startTime && data.endTime) {
        const startMinutes = timeToMinutes(data.startTime);
        const endMinutes = timeToMinutes(data.endTime);

        if (endMinutes <= startMinutes) {
          this.logger.warn('endTime must be after startTime', UpdateBlockedTimeUseCase.name);
          throw new BadRequestException('endTime must be after startTime');
        }
      }

      if (data.date) {
        const blockedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (blockedDate < today) {
          this.logger.warn('Cannot block a date in the past', UpdateBlockedTimeUseCase.name);
          throw new BadRequestException('Cannot block a date in the past');
        }
      }

      const blockedTime = await this.blockedTimeRepository.update(id, data);
      this.logger.log('Blocked time updated!', UpdateBlockedTimeUseCase.name);
      return blockedTime;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      const error = new ServiceUnavailableException({
        message: 'Error updating blocked time',
        cause: err,
        description: 'Error updating blocked time',
      });
      this.logger.error(error.message, err.stack);
      throw error;
    }
  }
}
