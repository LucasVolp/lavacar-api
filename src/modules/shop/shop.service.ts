import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { CreateShopUseCase, DeleteShopUseCase, FindAllShopUseCase, FindShopByIdUseCase, FindShopBySlugUseCase, UpdateShopUseCase } from './use-cases';

@Injectable()
export class ShopService {
  constructor(
    private readonly CreateShopUseCase: CreateShopUseCase,
    private readonly FindAllShopUseCase: FindAllShopUseCase,
    private readonly FindShopByIdUseCase: FindShopByIdUseCase,
    private readonly UpdateShopUseCase: UpdateShopUseCase,
    private readonly DeleteShopUseCase: DeleteShopUseCase,
    private readonly FindShopBySlugUseCase: FindShopBySlugUseCase
  ){}
  async create(data: CreateShopDto) {
    return await this.CreateShopUseCase.execute(data);
  }

  async findAll(filters?: { organizationId?: string; page?: number; perPage?: number }) {
    return await this.FindAllShopUseCase.execute(filters);
  }

  async findOne(id: string) {
    return await this.FindShopByIdUseCase.execute(id);
  }

  async update(id: string, data: UpdateShopDto) {
    return await this.UpdateShopUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.DeleteShopUseCase.execute(id);
  }

  async findBySlug(slug: string) {
    return await this.FindShopBySlugUseCase.execute(slug);
  }
}
