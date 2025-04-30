import { Injectable } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleUseCase, DeleteScheduleUseCase, FindAllScheduleUseCase, FindScheduleByIdUseCase, UpdateScheduleUseCase } from './use-cases';

@Injectable()
export class ScheduleService {
  constructor (
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly findAllSchedulesUseCase: FindAllScheduleUseCase,
    private readonly findScheduleByIdUseCase: FindScheduleByIdUseCase,
    private readonly updateScheduleUseCase: UpdateScheduleUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase
  ) {}

  async create(data: CreateScheduleDto) {
    return await this.createScheduleUseCase.execute(data);
  }

  async findAll() {
    return await this.findAllSchedulesUseCase.execute();
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
