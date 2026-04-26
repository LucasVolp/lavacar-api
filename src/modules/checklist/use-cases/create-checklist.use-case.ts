import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateChecklistDto } from '../dto/create-checklist.dto';
import { CreateChecklistRepository, FindChecklistByIdRepository } from '../repository';
import { FindAppointmentByIdRepository } from 'src/modules/appointment/repository';

@Injectable()
export class CreateChecklistUseCase {
    constructor(
        private readonly createChecklistRepository: CreateChecklistRepository,
        private readonly findChecklistRepository: FindChecklistByIdRepository,
        private readonly findAppointmentRepository: FindAppointmentByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateChecklistDto) {
        try {
            // Check if appointment exists
            const appointment = await this.findAppointmentRepository.findById(data.appointmentId);
            if (!appointment) {
                this.logger.warn(`Appointment not found: ${data.appointmentId}`, CreateChecklistUseCase.name);
                throw new NotFoundException('Appointment not found');
            }

            // Check if checklist already exists for this appointment
            const existingChecklist = await this.findChecklistRepository.findByAppointmentId(data.appointmentId);
            if (existingChecklist) {
                this.logger.warn(`Checklist already exists for appointment: ${data.appointmentId}`, CreateChecklistUseCase.name);
                throw new ConflictException('Checklist already exists for this appointment');
            }

            const checklist = await this.createChecklistRepository.create(data);
            this.logger.log(`Checklist created for appointment: ${data.appointmentId}`, CreateChecklistUseCase.name);
            return checklist;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof ConflictException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating checklist',
            });
            this.logger.error(error.message, err.stack, CreateChecklistUseCase.name);
            throw error;
        }
    }
}
