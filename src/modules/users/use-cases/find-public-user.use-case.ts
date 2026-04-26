import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindPublicUserRepository } from "../repository";
import { isValidPhone } from "src/shared/utils";

@Injectable()
export class FindPublicUserUseCase {
    constructor (
        private readonly userRepository: FindPublicUserRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(phone: string) {
        try {

            if (!phone || !isValidPhone(phone)) {
                this.logger.warn('Invalid phone number provided', FindPublicUserUseCase.name);
                throw new BadRequestException('Invalid phone number provided');
            }

            const userExists = await this.userRepository.findPublicUser(phone);

            if (!userExists) {
                this.logger.warn('User not found by phone', FindPublicUserUseCase.name);
                throw new NotFoundException('User not found!');
            }

            this.logger.log('User found by phone', FindPublicUserUseCase.name);
            const shadowUser = {
                id: userExists.id,
                firstName: userExists.firstName.substring(0, 3) + "*".repeat(userExists.firstName.length - 4) + userExists.firstName.slice(-1),
                lastName: userExists.lastName ? userExists.lastName.substring(0, 2) + "*".repeat(userExists.lastName.length - 3) + userExists.lastName.slice(-1) : undefined,
                phone: userExists.phone,
                role: userExists.role,
                isGuest: userExists.isGuest,
                isActive: userExists.isActive,
                vehicles: userExists.vehicles.map(vehicle => ({
                    id: vehicle.id,
                    plate: vehicle.plate ? vehicle.plate.substring(0, 2) + "*".repeat(vehicle.plate.length - 4) + vehicle.plate.slice(-2) : undefined,
                    model: vehicle.model,
                    brand: vehicle.brand,
                    color: vehicle.color,
                    year: vehicle.year,
                    size: vehicle.size,
                    type: vehicle.type,
                    isActive: vehicle.isActive,
                }))
            }
            return shadowUser;
        }
        catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }  

            const error = new ServiceUnavailableException('Something bad happened', {
                cause: err,
                description: 'Error finding User by phone',
            })
            this.logger.error(error.message);
            throw error;
        }
    }
}