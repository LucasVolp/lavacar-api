import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindChecklistByIdRepository } from '../repository';

@Injectable()
export class FindChecklistByIdUseCase {
    constructor(
        private readonly findChecklistRepository: FindChecklistByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        try {
            const checklist = await this.findChecklistRepository.findById(id);
            if (!checklist) {
                this.logger.warn(`Checklist not found: ${id}`, FindChecklistByIdUseCase.name);
                throw new NotFoundException('Checklist not found');
            }
            return checklist;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding checklist',
            });
            this.logger.error(error.message, err.stack, FindChecklistByIdUseCase.name);
            throw error;
        }
    }

    async executeByAppointmentId(appointmentId: string) {
        try {
            const checklist = await this.findChecklistRepository.findByAppointmentId(appointmentId);
             // It's acceptable to return null if no checklist exists for an appointment (e.g., frontend checking)
             // or throw NotFound depending on requirement. Let's return null if not found to allow "create new" logic in frontend.
             // However, for consistency with other findById use cases, if it's an explicit "get checklist for this appointment", 
             // and it doesn't exist, it might be a 404. Let's stick to 404 for consistency with "Find By Id".
            if (!checklist) {
                 this.logger.warn(`Checklist not found for appointment: ${appointmentId}`, FindChecklistByIdUseCase.name);
                 throw new NotFoundException('Checklist not found for this appointment');
            }
            return checklist;
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error finding checklist',
            });
            this.logger.error(error.message, err.stack, FindChecklistByIdUseCase.name);
            throw error;
        }
    }
}
