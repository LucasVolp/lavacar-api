import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateBlockedTimeRepository, FindBlockedTimeByIdRepository } from '../repository';
import { UpdateBlockedTimeDto } from '../dto/update-blocked-time.dto';
import { BlockedTimeType } from '../types/BlockedTimeType';
import { timeToMinutes } from 'src/shared/utils';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class UpdateBlockedTimeUseCase {
  constructor(
    private readonly blockedTimeRepository: UpdateBlockedTimeRepository,
    private readonly findBlockedTimeByIdRepository: FindBlockedTimeByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateBlockedTimeDto, user: JwtPayload) {
    try {
      const exists = await this.findBlockedTimeByIdRepository.findById(id, user);
      if (!exists) {
        this.logger.warn(`Blocked time not found with ID: ${id}`, UpdateBlockedTimeUseCase.name);
        throw new NotFoundException('Blocked time not found!');
      }

      const shopTimeZone = exists.shop?.timeZone || 'America/Sao_Paulo';
      const updateData: Record<string, unknown> = { ...data };

      if (data.type === BlockedTimeType.PARTIAL && data.startTime && data.endTime) {
        const startMinutes = timeToMinutes(data.startTime);
        const endMinutes = timeToMinutes(data.endTime);

        if (endMinutes <= startMinutes) {
          this.logger.warn('endTime must be after startTime', UpdateBlockedTimeUseCase.name);
          throw new BadRequestException('endTime must be after startTime');
        }
      }

      if (data.date) {
        const todayKey = formatInTimeZone(new Date(), shopTimeZone, 'yyyy-MM-dd');
        if (data.date < todayKey) {
          this.logger.warn('Cannot block a date in the past', UpdateBlockedTimeUseCase.name);
          throw new BadRequestException('Cannot block a date in the past');
        }
        updateData.date = new Date(`${data.date}T00:00:00.000Z`);
      }

      const blockedTime = await this.blockedTimeRepository.update(
        id,
        updateData as UpdateBlockedTimeDto & { date?: Date | string },
      );
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
