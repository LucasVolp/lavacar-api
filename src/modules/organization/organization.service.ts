import { Injectable } from '@nestjs/common';
import { 
    CreateOrganizationUseCase,
    FindAllOrganizationUseCase,
    FindOrganizationByIdUseCase,
    UpdateOrganizationUseCase,
    DeleteOrganizationUseCase,
    FindOrganizationByOwnerUseCase,
} from './use-cases';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationService {
    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
        private readonly findAllOrganizationUseCase: FindAllOrganizationUseCase,
        private readonly findOrganizationByIdUseCase: FindOrganizationByIdUseCase,
        private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
        private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
        private readonly findOrganizationByOwnerUseCase: FindOrganizationByOwnerUseCase,
    ) {}

    create(data: CreateOrganizationDto) {
        return this.createOrganizationUseCase.execute(data);
    }

    findAll(filters?: { page?: number; perPage?: number }) {
        return this.findAllOrganizationUseCase.execute(filters);
    }

    findById(id: string) {
        return this.findOrganizationByIdUseCase.execute(id);
    }

    findBySlug(slug: string) {
        return this.findOrganizationByIdUseCase.executeBySlug(slug);
    }

    findByOwner(ownerId: string) {
        return this.findOrganizationByOwnerUseCase.execute(ownerId);
    }

    update(id: string, data: UpdateOrganizationDto) {
        return this.updateOrganizationUseCase.execute(id, data);
    }

    delete(id: string) {
        return this.deleteOrganizationUseCase.execute(id);
    }
}
