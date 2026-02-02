import { Injectable } from '@nestjs/common';
import { CreateShopClientDto } from './dto/create-shop-client.dto';
import {
    CreateShopClientUseCase,
    DeleteShopClientUseCase,
    FindAllShopClientUseCase,
    FindShopClientByIdUseCase,
} from './use-cases';

@Injectable()
export class ShopClientService {
    constructor(
        private readonly createShopClientUseCase: CreateShopClientUseCase,
        private readonly findAllShopClientUseCase: FindAllShopClientUseCase,
        private readonly findShopClientByIdUseCase: FindShopClientByIdUseCase,
        private readonly deleteShopClientUseCase: DeleteShopClientUseCase,
    ) {}

    async create(data: CreateShopClientDto) {
        return await this.createShopClientUseCase.execute(data);
    }

    async findAll() {
        return await this.findAllShopClientUseCase.execute();
    }

    async findByShopId(shopId: string) {
        return await this.findAllShopClientUseCase.executeByShopId(shopId);
    }

    async findOne(id: string) {
        return await this.findShopClientByIdUseCase.execute(id);
    }

    async remove(id: string) {
        return await this.deleteShopClientUseCase.execute(id);
    }
}