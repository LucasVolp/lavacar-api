import { Injectable } from '@nestjs/common';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CreateBlockedTimeUseCase, FindAllBlockedTimeUseCase, FindBlockedTimeByIdUseCase, UpdateBlockedTimeUseCase, DeleteBlockedTimeUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { OwnershipService } from 'src/shared/services/ownership.service';

@Injectable()
export class BlockedTimesService {
  constructor(
    private readonly createBlockedTimeUseCase: CreateBlockedTimeUseCase,
    private readonly findAllBlockedTimeUseCase: FindAllBlockedTimeUseCase,
    private readonly findBlockedTimeByIdUseCase: FindBlockedTimeByIdUseCase,
    private readonly updateBlockedTimeUseCase: UpdateBlockedTimeUseCase,
    private readonly deleteBlockedTimeUseCase: DeleteBlockedTimeUseCase,
    private readonly ownershipService: OwnershipService,
  ) {}

  async create(data: CreateBlockedTimeDto, user: JwtPayload) {
    await this.ownershipService.assertShopAccess(user.id, user.role, data.shopId);
    return await this.createBlockedTimeUseCase.execute(data);
  }

  async findAll(filters?: { shopId?: string; page?: number; perPage?: number }) {
    return await this.findAllBlockedTimeUseCase.execute(filters);
  }

  async findOne(id: string) {
    return await this.findBlockedTimeByIdUseCase.execute(id);
  }

  async update(id: string, data: UpdateBlockedTimeDto) {
    return await this.updateBlockedTimeUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.deleteBlockedTimeUseCase.execute(id);
  }
}
