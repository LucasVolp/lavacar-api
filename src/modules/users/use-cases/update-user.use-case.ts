import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindUserByEmailRepository, FindUserRepository, UpdateUserRepository } from "../repository";
import { UpdateUserDto } from "../dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdateUserUseCase {
    private readonly saltRounds = 10;
    constructor(
        private readonly UserRepository: UpdateUserRepository,
        private readonly FindUserRepository: FindUserRepository,
        private readonly findUserByEmailRepository: FindUserByEmailRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string, data: UpdateUserDto){
        try {
            const UserExists = await this.FindUserRepository.findById(id);
            if (!UserExists) {
                throw new NotFoundException('User not found!');
            }
            
            if (data.email) {
                const emailTaken = await this.findUserByEmailRepository.findUserByEmail(data.email);
                if (emailTaken && emailTaken.id !== id) {
                    throw new ConflictException('Email already in use!');
                }
            }

            if (data.password){
                this.logger.log('Hashing password', UpdateUserUseCase.name);
                data.password = await bcrypt.hash(data.password, this.saltRounds);
            }

            const user = await this.UserRepository.update(id, data);
            this.logger.log('User Updated', UpdateUserUseCase.name);
            return user;
        } catch (err) {
            if (err instanceof NotFoundException || 
                err instanceof ConflictException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating User'
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}