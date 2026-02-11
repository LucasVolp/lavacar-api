import { Injectable } from '@nestjs/common';
import { CreateShopClientDto } from './dto/create-shop-client.dto';
import { UpdateShopClientDto } from './dto/update-shop-client.dto';
import { FilterShopClientDto } from './dto/filter-shop-client.dto';
import {
    CreateShopClientUseCase,
    DeleteShopClientUseCase,
    FindAllShopClientUseCase,
    FindShopClientByIdUseCase,
    UpdateShopClientUseCase,
} from './use-cases';
import { FindAllShopClientRepository } from './repository';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { OwnershipService } from 'src/shared/services/ownership.service';

@Injectable()
export class ShopClientService {
    constructor(
        private readonly createShopClientUseCase: CreateShopClientUseCase,
        private readonly findAllShopClientUseCase: FindAllShopClientUseCase,
        private readonly findShopClientByIdUseCase: FindShopClientByIdUseCase,
        private readonly deleteShopClientUseCase: DeleteShopClientUseCase,
        private readonly updateShopClientUseCase: UpdateShopClientUseCase,
        private readonly findAllShopClientRepository: FindAllShopClientRepository,
        private readonly ownershipService: OwnershipService,
    ) {}

    async create(data: CreateShopClientDto, user: JwtPayload) {
        await this.ownershipService.assertShopAccess(user.id, user.role, data.shopId);
        return await this.createShopClientUseCase.execute(data);
    }

    async findAll(filters?: FilterShopClientDto) {
        return await this.findAllShopClientUseCase.execute(filters);
    }

    async findByShopId(shopId: string, filters?: FilterShopClientDto) {
        return await this.findAllShopClientUseCase.executeByShopId(shopId, filters);
    }

    async countByShopId(shopId: string) {
        return await this.findAllShopClientRepository.countByShopId(shopId);
    }

    async findOne(id: string) {
        return await this.findShopClientByIdUseCase.execute(id);
    }

    async update(id: string, data: UpdateShopClientDto) {
        return await this.updateShopClientUseCase.execute(id, data);
    }

    async remove(id: string) {
        return await this.deleteShopClientUseCase.execute(id);
    }
}