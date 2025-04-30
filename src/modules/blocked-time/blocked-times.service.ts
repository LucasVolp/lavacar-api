import { Injectable } from '@nestjs/common';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CreateBlockedTimeUseCase, FindAllBlockedTimeUseCase, FindBlockedTimeByIdUseCase, UpdateBlockedTimeUseCase, DeleteBlockedTimeUseCase } from './use-cases';

@Injectable()
export class BlockedTimesService {
  constructor(
    private readonly createBlockedTimeUseCase: CreateBlockedTimeUseCase,
    private readonly findAllBlockedTimeUseCase: FindAllBlockedTimeUseCase,
    private readonly findBlockedTimeByIdUseCase: FindBlockedTimeByIdUseCase,
    private readonly updateBlockedTimeUseCase: UpdateBlockedTimeUseCase,
    private readonly deleteBlockedTimeUseCase: DeleteBlockedTimeUseCase,
  ) {}

  async create(data: CreateBlockedTimeDto) {
    return await this.createBlockedTimeUseCase.execute(data);
  }

  async findAll() {
    return await this.findAllBlockedTimeUseCase.execute();
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
