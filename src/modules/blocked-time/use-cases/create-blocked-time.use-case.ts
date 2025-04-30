import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateBlockedTimeDto } from '../dto/create-blocked-time.dto';
import { CreateBlockedTimeRepository } from '../repository';

@Injectable()
export class CreateBlockedTimeUseCase {
  constructor(
    private readonly BlockedTimeRepository: CreateBlockedTimeRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(data: CreateBlockedTimeDto) {
    try {
      const blockedTime = await this.BlockedTimeRepository.create(data);
      this.logger.log('Blocked time created!', CreateBlockedTimeUseCase.name);
      return blockedTime;
    } catch (err) {
      const error = new ServiceUnavailableException({
        message: 'Error creating blocked time',
        cause: err,
        description: 'Error creating blocked time',
      });
      this.logger.error(error.message, err.stack);
      throw error;
    }
  }
}
