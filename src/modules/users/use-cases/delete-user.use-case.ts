import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteUserRepository, FindUserRepository } from "../repository";

@Injectable()
export class DeleteUserUseCase {
    constructor(
        private readonly UserRepository: DeleteUserRepository,
        private readonly FindUserRepository: FindUserRepository,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string) {
        try {
            const UserExists = await this.FindUserRepository.findById(id);

            if (!UserExists) {
                throw new NotFoundException('User not found!');
            }

            const user = await this.UserRepository.delete(id);
            this.logger.log('User Deleted!', DeleteUserUseCase.name);
            return user;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting user!'
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}