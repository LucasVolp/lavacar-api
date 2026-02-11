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
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { OwnershipService } from 'src/shared/services/ownership.service';

@Injectable()
export class AppointmentService {
    constructor(
        private readonly createAppointmentUseCase: CreateAppointmentUseCase,
        private readonly findAllAppointmentUseCase: FindAllAppointmentUseCase,
        private readonly findAppointmentByIdUseCase: FindAppointmentByIdUseCase,
        private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
        private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
        private readonly ownershipService: OwnershipService,
    ) {}

    async create(data: CreateAppointmentDto, user: JwtPayload) {
        await this.ownershipService.assertShopAccess(user.id, user.role, data.shopId);
        return await this.createAppointmentUseCase.execute(data, { id: user.id, role: user.role as any });
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

    async cancel(id: string, user: JwtPayload, reason?: string) {
        return await this.cancelAppointmentUseCase.execute(id, reason, user.id);
    }
}
