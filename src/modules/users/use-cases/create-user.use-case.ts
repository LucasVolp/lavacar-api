import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateUserRepository } from "../repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { User } from "@prisma/client";
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserUseCase {
    private readonly saltRounds = 10;
    constructor(
        private readonly UserRepository: CreateUserRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateUserDto): Promise<User> {
        try {
            const createHash = await bcrypt.hash(data.password, this.saltRounds);
            const user = await this.UserRepository.create({
                ...data,
                password: createHash,
            });
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