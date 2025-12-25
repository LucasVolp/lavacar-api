import { Injectable } from '@nestjs/common';
import {
    CreateShopManagerUseCase,
    FindAllShopManagerUseCase,
    FindShopManagerByIdUseCase,
    UpdateShopManagerUseCase,
    DeleteShopManagerUseCase,
} from './use-cases';
import { CreateShopManagerDto, UpdateShopManagerDto } from './dto';

@Injectable()
export class ShopManagerService {
    constructor(
        private readonly createShopManagerUseCase: CreateShopManagerUseCase,
        private readonly findAllShopManagerUseCase: FindAllShopManagerUseCase,
        private readonly findShopManagerByIdUseCase: FindShopManagerByIdUseCase,
        private readonly updateShopManagerUseCase: UpdateShopManagerUseCase,
        private readonly deleteShopManagerUseCase: DeleteShopManagerUseCase,
    ) {}

    create(data: CreateShopManagerDto) {
        return this.createShopManagerUseCase.execute(data);
    }

    findAll() {
        return this.findAllShopManagerUseCase.execute();
    }

    findByShopId(shopId: string) {
        return this.findAllShopManagerUseCase.executeByShopId(shopId);
    }

    findByMemberId(memberId: string) {
        return this.findAllShopManagerUseCase.executeByMemberId(memberId);
    }

    findById(id: string) {
        return this.findShopManagerByIdUseCase.execute(id);
    }

    update(id: string, data: UpdateShopManagerDto) {
        return this.updateShopManagerUseCase.execute(id, data);
    }

    delete(id: string) {
        return this.deleteShopManagerUseCase.execute(id);
    }
}
