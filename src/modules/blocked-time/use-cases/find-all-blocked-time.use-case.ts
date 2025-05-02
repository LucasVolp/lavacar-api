import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllBlockedTimeRepository } from '../repository';

@Injectable()
export class FindAllBlockedTimeUseCase {
  constructor(
    private readonly blockedTimeRepository: FindAllBlockedTimeRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute() {
    try {
      const blockedTimes = await this.blockedTimeRepository.findAll();
      this.logger.log('Blocked times found!', FindAllBlockedTimeUseCase.name);
      return blockedTimes;
    } catch (err) {
      const error = new ServiceUnavailableException({
        message: 'Error finding blocked times',
        cause: err,
        description: 'Error finding blocked times',
      });
      this.logger.error(error.message, err.stack);
      throw error;
    }
  }
}
