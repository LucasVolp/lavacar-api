import { Injectable } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleUseCase, DeleteScheduleUseCase, FindAllScheduleUseCase, FindScheduleByIdUseCase, UpdateScheduleUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { OwnershipService } from 'src/shared/services/ownership.service';

@Injectable()
export class ScheduleService {
  constructor (
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly findAllSchedulesUseCase: FindAllScheduleUseCase,
    private readonly findScheduleByIdUseCase: FindScheduleByIdUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase,
    private readonly ownershipService: OwnershipService,
  ) {}

  async create(data: CreateScheduleDto, user: JwtPayload) {
    await this.ownershipService.assertShopAccess(user.id, user.role, data.shopId);
    return await this.createScheduleUseCase.execute(data);
  }

  async findAll(filters?: { shopId?: string; page?: number; perPage?: number }) {
    return await this.findAllSchedulesUseCase.execute(filters);
  }

  async findOne(id: string) {
    return await this.findScheduleByIdUseCase.execute(id);
  }

  async update(id: string, data: UpdateScheduleDto) {
    return await this.updateScheduleUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.deleteScheduleUseCase.execute(id);
  }
}
