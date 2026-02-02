import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CreateSalesGoalDto } from '../dto/create-sales-goal.dto';
import { CreateSalesGoalRepository } from '../repository';
import { FindShopByIdRepository } from 'src/modules/shop/repository';
import { FindOrganizationByIdRepository } from 'src/modules/organization/repository';

@Injectable()
export class CreateSalesGoalUseCase {
    constructor(
        private readonly createSalesGoalRepository: CreateSalesGoalRepository,
        private readonly findShopByIdRepository: FindShopByIdRepository,
        private readonly findOrganizationByIdRepository: FindOrganizationByIdRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateSalesGoalDto) {
        try {
            // Validation: Must have either shopId or organizationId
            if (!data.shopId && !data.organizationId) {
                this.logger.warn('Missing shopId or organizationId', CreateSalesGoalUseCase.name);
                throw new BadRequestException('Either shopId or organizationId must be provided');
            }

            if (data.shopId && data.organizationId) {
                this.logger.warn('Both shopId and organizationId provided', CreateSalesGoalUseCase.name);
                throw new BadRequestException('Provide either shopId or organizationId, not both');
            }

            // Verify existence
            if (data.shopId) {
                const shop = await this.findShopByIdRepository.findById(data.shopId);
                if (!shop) {
                    this.logger.warn(`Shop not found: ${data.shopId}`, CreateSalesGoalUseCase.name);
                    throw new NotFoundException('Shop not found');
                }
            }

            if (data.organizationId) {
                const org = await this.findOrganizationByIdRepository.findById(data.organizationId);
                if (!org) {
                    this.logger.warn(`Organization not found: ${data.organizationId}`, CreateSalesGoalUseCase.name);
                    throw new NotFoundException('Organization not found');
                }
            }

            // Date validations
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today

            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);

            // "Não pode criar uma no passado"
            // Assuming this means startDate cannot be before today.
            // Converting startDate string to date at 00:00:00 for comparison if it comes as ISO date string without time or with time.
            // If it comes with time, we might want to respect it or just check date part.
            // Let's assume start of day comparison.
            const startDateOnly = new Date(startDate);
            startDateOnly.setHours(0, 0, 0, 0);

            if (startDateOnly < now) {
                this.logger.warn('Start date cannot be in the past', CreateSalesGoalUseCase.name);
                throw new BadRequestException('Start date cannot be in the past');
            }

            if (endDate <= startDate) {
                this.logger.warn('End date must be after start date', CreateSalesGoalUseCase.name);
                throw new BadRequestException('End date must be after start date');
            }

            const salesGoal = await this.createSalesGoalRepository.create(data);
            this.logger.log(`Sales goal created`, CreateSalesGoalUseCase.name);
            return salesGoal;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof NotFoundException) {
                throw err;
            }
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating sales goal',
            });
            this.logger.error(error.message, err.stack, CreateSalesGoalUseCase.name);
            throw error;
        }
    }
}
