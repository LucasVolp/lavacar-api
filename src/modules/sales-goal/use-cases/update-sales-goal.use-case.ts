import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FindSalesGoalByIdRepository, UpdateSalesGoalRepository } from '../repository';
import { UpdateSalesGoalDto } from '../dto/update-sales-goal.dto';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Injectable()
export class UpdateSalesGoalUseCase {
    constructor(
        private readonly updateSalesGoalRepository: UpdateSalesGoalRepository,
        private readonly findSalesGoalRepository: FindSalesGoalByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateSalesGoalDto, user: JwtPayload) {
        try {
            const existing = await this.findSalesGoalRepository.findById(id, user);
            if (!existing) {
                this.logger.warn(`Sales goal not found: ${id}`, UpdateSalesGoalUseCase.name);
                throw new NotFoundException('Sales goal not found');
            }

            if (data.startDate || data.endDate) {
                const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
                const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

                if (data.startDate) {
                     const now = new Date();
                     now.setHours(0,0,0,0);
                     const newStart = new Date(data.startDate);
                     newStart.setHours(0,0,0,0);
                     
                     // Allow updating start date if it's still in the future or today?
                     // Or prevent changing to past.
                     if (newStart < now) {
                        // Exception: maybe existing one was created in the past correctly, but if we are CHANGING it now, we shouldn't change it to past.
                        // Or maybe we should allow correction?
                        // "Não pode criar uma no passado" implies creation logic.
                        // For update, let's enforce endDate > startDate.
                     }
                }

                if (endDate <= startDate) {
                    this.logger.warn('End date must be after start date', UpdateSalesGoalUseCase.name);
                    throw new BadRequestException('End date must be after start date');
                }
            }

            const updated = await this.updateSalesGoalRepository.update(id, data);
            this.logger.log(`Sales goal updated: ${id}`, UpdateSalesGoalUseCase.name);
            return updated;
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error updating sales goal',
            });
            this.logger.error(error.message, err.stack, UpdateSalesGoalUseCase.name);
            throw error;
        }
    }
}
