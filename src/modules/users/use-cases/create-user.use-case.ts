import { ConflictException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { CreateUserRepository, FindUserByCpfRepository, FindUserByEmailRepository, FindUserByPhoneRepository } from "../repository";
import { CreateUserDto } from "../dto/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreateUserUseCase {
    private readonly saltRounds = 10;
    constructor(
        private readonly userRepository: CreateUserRepository,
        private readonly findUserByEmailRepository: FindUserByEmailRepository,
        private readonly findUserByCpfRepository: FindUserByCpfRepository,
        private readonly findUserByPhoneRepository: FindUserByPhoneRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(data: CreateUserDto){
        try {
            const existingByPhone = await this.findUserByPhoneRepository.findByPhone(data.phone);

            if (existingByPhone) {
                this.logger.warn('User with this phone already exists', CreateUserUseCase.name);
                throw new ConflictException('User with this phone already exists!');
            }

            if (data.email) {
                const existingByEmail = await this.findUserByEmailRepository.findUserByEmail(data.email);
                if (existingByEmail) {
                    this.logger.warn('User with this email already exists', CreateUserUseCase.name);
                    throw new ConflictException('User with this email already exists');
                }
            }

            if (data.cpf) {
                const existingByCpf = await this.findUserByCpfRepository.findByCpf(data.cpf);
                if (existingByCpf) {
                    this.logger.warn('User with this CPF already exists', CreateUserUseCase.name);
                    throw new ConflictException('User with this CPF already exists');
                }

                data.cpf = data.cpf.replace(/[.-]/g, '');
            }

            const isGuest = !data.password;

            let hashedPassword: string | undefined;
            if (data.password) {
                hashedPassword = await bcrypt.hash(data.password, this.saltRounds) as string;
            }

            this.logger.log(
                `Creating ${isGuest ? 'guest' : 'full'} user...`,
                CreateUserUseCase.name,
            );

            const user = await this.userRepository.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                cpf: data.cpf,
                password: hashedPassword,
                role: data.role,
                isGuest,
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
            throw error;
        }
    }
}