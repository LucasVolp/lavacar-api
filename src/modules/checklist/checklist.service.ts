import { Injectable } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import {
    CreateChecklistUseCase,
    DeleteChecklistUseCase,
    FindChecklistByIdUseCase,
    UpdateChecklistUseCase,
} from './use-cases';

@Injectable()
export class ChecklistService {
    constructor(
        private readonly createChecklistUseCase: CreateChecklistUseCase,
        private readonly findChecklistByIdUseCase: FindChecklistByIdUseCase,
        private readonly updateChecklistUseCase: UpdateChecklistUseCase,
        private readonly deleteChecklistUseCase: DeleteChecklistUseCase,
    ) {}

    async create(data: CreateChecklistDto) {
        return await this.createChecklistUseCase.execute(data);
    }

    async findOne(id: string) {
        return await this.findChecklistByIdUseCase.execute(id);
    }

    async findByAppointment(appointmentId: string) {
        return await this.findChecklistByIdUseCase.executeByAppointmentId(appointmentId);
    }

    async update(id: string, data: UpdateChecklistDto) {
        return await this.updateChecklistUseCase.execute(id, data);
    }

    async remove(id: string) {
        return await this.deleteChecklistUseCase.execute(id);
    }
}