import { ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { CreateUserRepository, FindUserByEmailRepository, FindUserByPhoneRepository } from '../../users/repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterUseCase {
    private readonly saltRounds = 10;

    constructor(
        private readonly createUserRepository: CreateUserRepository,
        private readonly findUserByEmailRepository: FindUserByEmailRepository,
        private readonly findUserByPhoneRepository: FindUserByPhoneRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: RegisterDto) {
        try {
            const existingByPhone = await this.findUserByPhoneRepository.findByPhone(data.phone);
            if (existingByPhone) {
                this.logger.warn('User with this phone already exists', RegisterUseCase.name);
                throw new ConflictException('Já existe um usuário com este telefone.');
            }

            if (data.email) {
                const existingByEmail = await this.findUserByEmailRepository.findUserByEmail(data.email);
                if (existingByEmail) {
                    this.logger.warn('User with this email already exists', RegisterUseCase.name);
                    throw new ConflictException('Já existe um usuário com este email.');
                }
            }

            const hashedPassword = await bcrypt.hash(data.password, this.saltRounds) as string;

            const user = await this.createUserRepository.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                isGuest: false,
            });

            this.logger.log('User registered successfully', RegisterUseCase.name);
            return user;
        } catch (err) {
            if (err instanceof ConflictException) throw err;
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error registering user',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
