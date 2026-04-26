import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DeleteOrganizationRepository } from '../repository/delete-organization.repository';
import { FindOrganizationByIdRepository } from '../repository/find-organization-by-id.repository';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class DeleteOrganizationUseCase {
    constructor(
        private readonly deleteOrganizationRepository: DeleteOrganizationRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly storageService: StorageService,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(id: string) {
        try {
            const organization = await this.findOrganizationByIdRepository.findById(id);
            if (!organization) {
                this.logger.warn(`Attempt to delete non-existing organization with id: ${id}`);
                throw new NotFoundException('Organization not found.');
            }

            // Collect all files to delete from R2
            const filesToDelete: string[] = [];

            // Organization logo
            if (organization.logoUrl) {
                filesToDelete.push(organization.logoUrl);
            }

            // All shop images (logo, banner, gallery)
            if (Array.isArray(organization.shops)) {
                for (const shop of organization.shops) {
                    if (shop.logoUrl) filesToDelete.push(shop.logoUrl);
                    if (shop.bannerUrl) filesToDelete.push(shop.bannerUrl);
                    if (Array.isArray(shop.gallery)) {
                        filesToDelete.push(...shop.gallery.filter((url): url is string => typeof url === 'string'));
                    }
                }
            }

            if (filesToDelete.length > 0) {
                await Promise.allSettled(
                    filesToDelete.map((url) => this.storageService.deleteFile(url))
                );
                this.logger.log(
                    `Deleted ${filesToDelete.length} file(s) from R2 for organization ${id}`,
                    DeleteOrganizationUseCase.name,
                );
            }

            return await this.deleteOrganizationRepository.delete(id);
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error deleting Organization'
            });
            this.logger.error(error.message, err.stack, DeleteOrganizationUseCase.name);
            throw error;
        }
    }
}
