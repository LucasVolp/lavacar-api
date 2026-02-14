import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindChecklistsByUserRepository } from '../repository';
import { FindUserRepository } from 'src/modules/users/repository';

@Injectable()
export class FindChecklistsByUserUseCase {
    constructor(
        private readonly findChecklistsByUserRepository: FindChecklistsByUserRepository,
        private readonly userRepository: FindUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(userId: string, page = 1, perPage = 10) {
        try {
            const userExists = await this.userRepository.findById(userId);
            if (!userExists) {
                this.logger.warn(`User with ID ${userId} not found`, FindChecklistsByUserUseCase.name);
                throw new NotFoundException(`User with ID ${userId} not found`);
            }
            return await this.findChecklistsByUserRepository.findByUserId(userId, page, perPage);
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding checklists by user',
            });
            this.logger.error(error.message, err.stack, FindChecklistsByUserUseCase.name);
            throw error;
        }
    }
}
