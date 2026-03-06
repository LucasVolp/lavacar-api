import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
    CreateAppointmentUseCase,
    FindAllAppointmentUseCase,
    FindAppointmentByIdUseCase,
    UpdateAppointmentUseCase,
    CancelAppointmentUseCase,
    FindPublicAppointmentsByDateUseCase,
    FindPublicAvailabilityUseCase,
} from './use-cases';
import { FindAllFilters } from './dto/filters-appointment.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class AppointmentService {
    constructor(
        private readonly createAppointmentUseCase: CreateAppointmentUseCase,
        private readonly findAllAppointmentUseCase: FindAllAppointmentUseCase,
        private readonly findAppointmentByIdUseCase: FindAppointmentByIdUseCase,
        private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
        private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
        private readonly findPublicAppointmentsByDateUseCase: FindPublicAppointmentsByDateUseCase,
        private readonly findPublicAvailabilityUseCase: FindPublicAvailabilityUseCase,
    ) {}

    async create(data: CreateAppointmentDto, user?: JwtPayload) {
        return await this.createAppointmentUseCase.execute(data, user ? { id: user.id, role: user.role as any } : undefined);
    }

    async findAll(filters: FindAllFilters = {}, user: JwtPayload) {
        return await this.findAllAppointmentUseCase.execute(filters, user);
    }

    async findOne(id: string, user: JwtPayload) {
        return await this.findAppointmentByIdUseCase.execute(id, user);
    }

    async update(id: string, data: UpdateAppointmentDto, user: JwtPayload) {
        return await this.updateAppointmentUseCase.execute(id, data, user);
    }

    async cancel(id: string, user: JwtPayload, reason?: string) {
        return await this.cancelAppointmentUseCase.execute(id, reason, user);
    }

    async findPublicByShopAndDate(shopId: string, date: string) {
        return await this.findPublicAppointmentsByDateUseCase.execute(shopId, new Date(date));
    }

    async findPublicAvailability(shopId: string, date: string, serviceIds: string[]) {
        return await this.findPublicAvailabilityUseCase.execute({ shopId, date, serviceIds });
    }
}
