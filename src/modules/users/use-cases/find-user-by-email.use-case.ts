import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindUserByEmailRepository } from "../repository";

@Injectable()
export class FindUserByEmailUseCase {
    constructor(
        private readonly UserRepository: FindUserByEmailRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(email: string){
        try {
            const UserExists = await this.UserRepository.findUserByEmail(email);
            if (!UserExists) {
                throw new NotFoundException('User not found!');
            }
            this.logger.log('User Found!', FindUserByEmailUseCase.name);
            return UserExists;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened', {
                cause: err,
                description: 'User not found!'
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}