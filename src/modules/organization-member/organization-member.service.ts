import { Injectable } from '@nestjs/common';
import {
    CreateOrganizationMemberUseCase,
    FindAllOrganizationMemberUseCase,
    FindOrganizationMemberByIdUseCase,
    UpdateOrganizationMemberUseCase,
    DeleteOrganizationMemberUseCase,
} from './use-cases';
import { CreateOrganizationMemberDto, UpdateOrganizationMemberDto } from './dto';

@Injectable()
export class OrganizationMemberService {
    constructor(
        private readonly createOrganizationMemberUseCase: CreateOrganizationMemberUseCase,
        private readonly findAllOrganizationMemberUseCase: FindAllOrganizationMemberUseCase,
        private readonly findOrganizationMemberByIdUseCase: FindOrganizationMemberByIdUseCase,
        private readonly updateOrganizationMemberUseCase: UpdateOrganizationMemberUseCase,
        private readonly deleteOrganizationMemberUseCase: DeleteOrganizationMemberUseCase,
    ) {}

    create(data: CreateOrganizationMemberDto) {
        return this.createOrganizationMemberUseCase.execute(data);
    }

    findAll(filters?: { page?: number; perPage?: number }) {
        return this.findAllOrganizationMemberUseCase.execute(filters);
    }

    findByOrganizationId(organizationId: string, filters?: { page?: number; perPage?: number }) {
        return this.findAllOrganizationMemberUseCase.executeByOrganizationId(organizationId, filters);
    }

    findById(id: string) {
        return this.findOrganizationMemberByIdUseCase.execute(id);
    }

    update(id: string, data: UpdateOrganizationMemberDto) {
        return this.updateOrganizationMemberUseCase.execute(id, data);
    }

    delete(id: string) {
        return this.deleteOrganizationMemberUseCase.execute(id);
    }
}
