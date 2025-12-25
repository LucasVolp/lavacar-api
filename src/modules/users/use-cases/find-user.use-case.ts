import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindUserRepository } from "../repository";

@Injectable()
export class FindUserUseCase {
    constructor(
        private readonly UserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger()
    ) {} 

    async execute(id: string){
        try {
            const UserExists = await this.UserRepository.findById(id);
            if (!UserExists) {
                this.logger.warn("User not found!", FindUserUseCase.name)
                throw new NotFoundException('User not found!');
            }
            this.logger.log("User Found", FindUserUseCase.name)
            return UserExists
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened', {
                cause: err,
                description: 'Error finding User'
            })
            this.logger.error(error.message);
            throw err;
        }
    }
}