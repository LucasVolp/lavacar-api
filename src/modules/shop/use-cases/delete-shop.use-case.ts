import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteShopRepository, FindShopByIdRepository } from "../repository";
import { StorageService } from "../../storage/storage.service";

@Injectable()
export class DeleteShopUseCase {
    constructor(
        private readonly ShopRepository: DeleteShopRepository,
        private readonly FindShopByIdRepository: FindShopByIdRepository,
        private readonly storageService: StorageService,
        private readonly logger: Logger = new Logger()
    ){}

    async execute(id: string){
        try {
            const shop = await this.FindShopByIdRepository.findById(id);
            if (!shop){
                this.logger.warn('Shop not found', DeleteShopUseCase.name);
                throw new NotFoundException("Shop not found!")
            }

            // Delete images from R2 before removing the shop
            const filesToDelete: string[] = [];
            if (shop.logoUrl) filesToDelete.push(shop.logoUrl);
            if (shop.bannerUrl) filesToDelete.push(shop.bannerUrl);
            if (Array.isArray(shop.gallery)) {
                filesToDelete.push(...shop.gallery.filter((url): url is string => typeof url === 'string'));
            }

            if (filesToDelete.length > 0) {
                await Promise.allSettled(
                    filesToDelete.map((url) => this.storageService.deleteFile(url))
                );
                this.logger.log(`Deleted ${filesToDelete.length} file(s) from R2 for shop ${id}`, DeleteShopUseCase.name);
            }

            const deletedShop = await this.ShopRepository.delete(id);
            this.logger.log('Shop Deleted', DeleteShopUseCase.name)
            return deletedShop;
        } catch (err) {
            if (err instanceof NotFoundException) throw err;
            const error = new ServiceUnavailableException("Something bad happened!", {
                cause: err,
                description: 'Error deleting shop',
            });
            this.logger.error(error.message);
            throw err;
        }
    }
}
