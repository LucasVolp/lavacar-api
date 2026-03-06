import { Injectable } from '@nestjs/common';
import { CreateShopClientDto } from './dto/create-shop-client.dto';
import { UpdateShopClientDto } from './dto/update-shop-client.dto';
import { FilterShopClientDto } from './dto/filter-shop-client.dto';
import {
    CreateShopClientUseCase,
    DeleteShopClientUseCase,
    FindAllShopClientUseCase,
    FindShopClientByIdUseCase,
    FindShopClientByShopAndUserUseCase,
    UpdateShopClientUseCase,
} from './use-cases';
import { FindAllShopClientRepository } from './repository';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class ShopClientService {
    constructor(
        private readonly createShopClientUseCase: CreateShopClientUseCase,
        private readonly findAllShopClientUseCase: FindAllShopClientUseCase,
        private readonly findShopClientByIdUseCase: FindShopClientByIdUseCase,
        private readonly deleteShopClientUseCase: DeleteShopClientUseCase,
        private readonly updateShopClientUseCase: UpdateShopClientUseCase,
        private readonly findAllShopClientRepository: FindAllShopClientRepository,
        private readonly findShopClientByShopAndUserUseCase: FindShopClientByShopAndUserUseCase,
    ) {}

    async create(data: CreateShopClientDto, user: JwtPayload) {
        return await this.createShopClientUseCase.execute(data, user);
    }

    async findAll(filters: FilterShopClientDto = {}, user: JwtPayload) {
        return await this.findAllShopClientUseCase.execute(filters, user);
    }

    async findByShopId(shopId: string, filters: FilterShopClientDto = {}, user: JwtPayload) {
        return await this.findAllShopClientUseCase.executeByShopId(shopId, filters, user);
    }

    async countByShopId(shopId: string, user: JwtPayload) {
        return await this.findAllShopClientRepository.countByShopId(shopId, user);
    }

    async findByShopAndUser(shopId: string, userId: string) {
        return await this.findShopClientByShopAndUserUseCase.execute(shopId, userId);
    }

    async findOne(id: string, user: JwtPayload) {
        return await this.findShopClientByIdUseCase.execute(id, user);
    }

    async update(id: string, data: UpdateShopClientDto, user: JwtPayload) {
        return await this.updateShopClientUseCase.execute(id, data, user);
    }

    async remove(id: string, user: JwtPayload) {
        return await this.deleteShopClientUseCase.execute(id, user);
    }
}
