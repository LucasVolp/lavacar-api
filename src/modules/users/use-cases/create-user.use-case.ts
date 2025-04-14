import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateUserRepository } from "../repository";
import { CreateUserDto } from "../dto/create-user.dto";

@Injectable()
export class CreateUserUseCase {
    constructor(
        private readonly UserRepository: CreateUserRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateUserDto) {
        try {
            const user = await this.UserRepository.create(data);
            this.logger.log('User Created', CreateUserUseCase.name);
            return user;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating User'
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}