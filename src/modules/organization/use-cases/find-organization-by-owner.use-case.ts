import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindOrganizationByOwnerRepository } from "../repository";

@Injectable()
export class FindOrganizationByOwnerUseCase {
    constructor(
        private readonly organizationRepository: FindOrganizationByOwnerRepository,
        private readonly logger: Logger,
    ) {}

    async execute(ownerId: string) {
        try {
            this.logger.log(`Finding organization for ownerId: ${ownerId}`);
            const organization = await this.organizationRepository.findByOwnerId(ownerId);
            if (!organization) {
                this.logger.warn(`No organization found for ownerId: ${ownerId}`);
                throw new NotFoundException("Organization not found");
            }
            this.logger.log(`Organization found for ownerId: ${ownerId}`);
            return organization;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error finding organization for ownerId: ${ownerId}`, error.stack);
            throw new ServiceUnavailableException("Unable to retrieve organization at this time");
        }
    }
}