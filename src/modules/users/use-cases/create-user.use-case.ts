import { ConflictException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateUserRepository, FindUserByCpfRepository, FindUserByEmailRepository } from "../repository";
import { CreateUserDto } from "../dto/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserUseCase {
    private readonly saltRounds = 10;
    constructor(
        private readonly UserRepository: CreateUserRepository,
        private readonly findUserRepository: FindUserByEmailRepository,
        private readonly findUserByCpfRepósitory: FindUserByCpfRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateUserDto){
        try {
            const userExists = await this.findUserRepository.findUserByEmail(data.email);
            if (userExists) {
                this.logger.warn('User with this email already exists', CreateUserUseCase.name);
                throw new ConflictException('User with this email already exists');
            }

            if (data.cpf) {
                const cpfExists = await this.findUserByCpfRepósitory.findByCpf(data.cpf);
                if (cpfExists) {
                    this.logger.warn('User with this CPF already exists', CreateUserUseCase.name);
                    throw new ConflictException('User with this CPF already exists');
                }

                data.cpf = data.cpf.replace(/[.-]/g, '');
            }

            this.logger.log('Creating User...', CreateUserUseCase.name);
            const createHash = await bcrypt.hash(data.password, this.saltRounds);
            const user = await this.UserRepository.create({
                ...data,
                password: createHash,
            });

            this.logger.log('User Created', CreateUserUseCase.name);
            return user;
        } catch (err) {
            if (err instanceof ConflictException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating User'
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}