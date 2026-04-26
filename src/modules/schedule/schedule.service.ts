import { Injectable } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleUseCase, DeleteScheduleUseCase, FindAllScheduleUseCase, FindPublicSchedulesUseCase, FindScheduleByIdUseCase, UpdateScheduleUseCase } from './use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class ScheduleService {
  constructor (
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly findAllSchedulesUseCase: FindAllScheduleUseCase,
    private readonly findPublicSchedulesUseCase: FindPublicSchedulesUseCase,
    private readonly findScheduleByIdUseCase: FindScheduleByIdUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase,
  ) {}

  async create(data: CreateScheduleDto, user: JwtPayload) {
    return await this.createScheduleUseCase.execute(data, user);
  }

  async findAll(filters: { shopId?: string; page?: number; perPage?: number } = {}, user: JwtPayload) {
    return await this.findAllSchedulesUseCase.execute(filters, user);
  }

  async findPublicByShopId(shopId: string) {
    return await this.findPublicSchedulesUseCase.execute(shopId);
  }

  async findOne(id: string, user: JwtPayload) {
    return await this.findScheduleByIdUseCase.execute(id, user);
  }

  async update(id: string, data: UpdateScheduleDto, user: JwtPayload) {
    return await this.updateScheduleUseCase.execute(id, data, user);
  }

  async remove(id: string, user: JwtPayload) {
    return await this.deleteScheduleUseCase.execute(id, user);
  }
}
