import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindBlockedTimeByIdRepository } from '../repository';

@Injectable()
export class FindBlockedTimeByIdUseCase {
  constructor(
    private readonly blockedTimeRepository: FindBlockedTimeByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    try {
      const blockedTime = await this.blockedTimeRepository.findById(id);
      if (!blockedTime) {
        this.logger.warn(`Blocked time not found with ID: ${id}`, FindBlockedTimeByIdUseCase.name);
        throw new NotFoundException('Blocked time not found!');
      }
      this.logger.log('Blocked time found!', FindBlockedTimeByIdUseCase.name);
      return blockedTime;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      const error = new ServiceUnavailableException({
        message: 'Error finding blocked time',
        cause: err,
        description: 'Error finding blocked time',
      });
      this.logger.error(error.message, err.stack);
      throw error;
    }
  }
}
