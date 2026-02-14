import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FindUserByPhoneRepository } from '../repository';

@Injectable()
export class FindUserByPhoneUseCase {
  constructor(
    private readonly findUserByPhoneRepository: FindUserByPhoneRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(phone: string) {
    try {
      const user = await this.findUserByPhoneRepository.findByPhone(phone);

      if (!user) {
        this.logger.warn(
          'User not found by phone',
          FindUserByPhoneUseCase.name,
        );
        throw new NotFoundException('User not found!');
      }

      this.logger.log('User found by phone', FindUserByPhoneUseCase.name);
      return user;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      const error = new ServiceUnavailableException(
        'Something bad happened',
        {
          cause: err,
          description: 'Error finding User by phone',
        },
      );
      this.logger.error(error.message);
      throw error;
    }
  }
}
