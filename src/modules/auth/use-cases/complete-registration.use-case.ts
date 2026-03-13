import { ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';
import { CreateUserRepository, FindUserByEmailRepository, FindUserByPhoneRepository } from '../../users/repository';

@Injectable()
export class CompleteRegistrationUseCase {
    constructor(
        private readonly createUserRepository: CreateUserRepository,
        private readonly findUserByEmailRepository: FindUserByEmailRepository,
        private readonly findUserByPhoneRepository: FindUserByPhoneRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CompleteRegistrationDto) {
        try {
            const existingByPhone = await this.findUserByPhoneRepository.findByPhone(data.phone);
            if (existingByPhone) {
                this.logger.warn('User with this phone already exists', CompleteRegistrationUseCase.name);
                throw new ConflictException('Já existe um usuário com este telefone.');
            }

            const existingByEmail = await this.findUserByEmailRepository.findUserByEmail(data.email);
            if (existingByEmail) {
                this.logger.warn('User with this email already exists', CompleteRegistrationUseCase.name);
                throw new ConflictException('Já existe um usuário com este email.');
            }

            const user = await this.createUserRepository.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                picture: data.picture,
                isGuest: false,
            });

            this.logger.log('Google user registration completed', CompleteRegistrationUseCase.name);
            return user;
        } catch (err) {
            if (err instanceof ConflictException) throw err;
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error completing registration',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
