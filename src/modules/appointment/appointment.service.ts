import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
    CreateAppointmentUseCase,
    FindAllAppointmentUseCase,
    FindAppointmentByIdUseCase,
    UpdateAppointmentUseCase,
    CancelAppointmentUseCase,
} from './use-cases';
import { FindAllFilters } from './dto/filters-appointment.dto';

@Injectable()
export class AppointmentService {
    constructor(
        private readonly createAppointmentUseCase: CreateAppointmentUseCase,
        private readonly findAllAppointmentUseCase: FindAllAppointmentUseCase,
        private readonly findAppointmentByIdUseCase: FindAppointmentByIdUseCase,
        private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
        private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    ) {}

    async create(data: CreateAppointmentDto) {
        return await this.createAppointmentUseCase.execute(data);
    }

    async findAll(filters: FindAllFilters = {}) {
        return await this.findAllAppointmentUseCase.execute(filters);
    }

    async findOne(id: string) {
        return await this.findAppointmentByIdUseCase.execute(id);
    }

    async update(id: string, data: UpdateAppointmentDto) {
        return await this.updateAppointmentUseCase.execute(id, data);
    }

    async cancel(id: string, reason?: string, userId?: string) {
        return await this.cancelAppointmentUseCase.execute(id, reason, userId);
    }
}
