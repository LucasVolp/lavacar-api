import { Injectable } from '@nestjs/common';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CreateBlockedTimeUseCase, FindAllBlockedTimeUseCase, FindBlockedTimeByIdUseCase, UpdateBlockedTimeUseCase, DeleteBlockedTimeUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class BlockedTimesService {
  constructor(
    private readonly createBlockedTimeUseCase: CreateBlockedTimeUseCase,
    private readonly findAllBlockedTimeUseCase: FindAllBlockedTimeUseCase,
    private readonly findBlockedTimeByIdUseCase: FindBlockedTimeByIdUseCase,
    private readonly updateBlockedTimeUseCase: UpdateBlockedTimeUseCase,
    private readonly deleteBlockedTimeUseCase: DeleteBlockedTimeUseCase,
  ) {}

  async create(data: CreateBlockedTimeDto, user: JwtPayload) {
    return await this.createBlockedTimeUseCase.execute(data, user);
  }

  async findAll(filters: { shopId?: string; page?: number; perPage?: number } = {}, user: JwtPayload) {
    return await this.findAllBlockedTimeUseCase.execute(filters, user);
  }

  async findOne(id: string, user: JwtPayload) {
    return await this.findBlockedTimeByIdUseCase.execute(id, user);
  }

  async update(id: string, data: UpdateBlockedTimeDto, user: JwtPayload) {
    return await this.updateBlockedTimeUseCase.execute(id, data, user);
  }

  async remove(id: string, user: JwtPayload) {
    return await this.deleteBlockedTimeUseCase.execute(id, user);
  }
}
