import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllUserRepository } from "../repository";

@Injectable()
export class FindAllUserUseCase {
    constructor(
        private readonly UserRepository: FindAllUserRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(){
        try{
            const userExists = await this.UserRepository.findAll();
            if (!userExists || userExists.length === 0) {
                this.logger.warn('No users found in the database.');
                return [];
            }
            return userExists;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding Users'
            })
            this.logger.error(error.message);
            throw err;
        }
    }
}