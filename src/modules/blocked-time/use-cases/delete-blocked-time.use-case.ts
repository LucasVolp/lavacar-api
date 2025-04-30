import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteBlockedTimeRepository, FindBlockedTimeByIdRepository } from '../repository';

@Injectable()
export class DeleteBlockedTimeUseCase {
  constructor(
    private readonly BlockedTimeRepository: DeleteBlockedTimeRepository,
    private readonly FindBlockedTimeByIdRepository: FindBlockedTimeByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    try {
      const exists = await this.FindBlockedTimeByIdRepository.findById(id);
      if (!exists) {
        throw new NotFoundException('Blocked time not found!');
      }
      const blockedTime = await this.BlockedTimeRepository.delete(id);
      this.logger.log('Blocked time deleted!', DeleteBlockedTimeUseCase.name);
      return blockedTime;
    } catch (err) {
      const error = new ServiceUnavailableException({
        message: 'Error deleting blocked time',
        cause: err,
        description: 'Error deleting blocked time',
      });
      this.logger.error(error.message, err.stack);
      throw error;
    }
  }
}
