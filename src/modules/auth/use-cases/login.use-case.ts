import { Injectable, Logger, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { FindUserByEmailWithPasswordRepository } from '../repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly findUserByEmailWithPasswordRepository: FindUserByEmailWithPasswordRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: LoginDto) {
        try {
            const user = await this.findUserByEmailWithPasswordRepository.findByEmail(data.email);

            if (!user) {
                throw new UnauthorizedException('Email ou senha inválidos.');
            }

            if (!user.password) {
                throw new UnauthorizedException('Esta conta não possui senha. Faça login com Google.');
            }

            const isPasswordValid = await bcrypt.compare(data.password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Email ou senha inválidos.');
            }

            this.logger.log('User logged in successfully', LoginUseCase.name);

            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error during login',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
