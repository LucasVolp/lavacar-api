import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { FindAllBlockedTimeRepository } from '../repository';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

interface FindAllFilters {
  shopId?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class FindAllBlockedTimeUseCase {
  constructor(
    private readonly blockedTimeRepository: FindAllBlockedTimeRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(filters: FindAllFilters = {}, user: JwtPayload) {
    try {
      const result = await this.blockedTimeRepository.findAll(filters, user);
      this.logger.log(`Found ${result.meta.total} blocked times`, FindAllBlockedTimeUseCase.name);
      return result;
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
