import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UpdateBlockedTimeRepository, FindBlockedTimeByIdRepository } from '../repository';
import { UpdateBlockedTimeDto } from '../dto/update-blocked-time.dto';

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
        throw new NotFoundException('Blocked time not found!');
      }
      const blockedTime = await this.blockedTimeRepository.update(id, data);
      this.logger.log('Blocked time updated!', UpdateBlockedTimeUseCase.name);
      return blockedTime;
    } catch (err) {
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
