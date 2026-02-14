import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
            // We use current timestamp for endDate check to ensure the period hasn't fully passed.
            
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);

            // Allow current periods (e.g. starting on the 1st of current month, even if today is the 7th)
            // But prevent creating goals for periods that are completely in the past.
            if (endDate < now) {
                this.logger.warn('Cannot create goal for a past period', CreateSalesGoalUseCase.name);
                throw new BadRequestException('Cannot create goal for a past period');
            }

            if (endDate <= startDate) {
                this.logger.warn('End date must be after start date', CreateSalesGoalUseCase.name);
                throw new BadRequestException('End date must be after start date');
            }

            const salesGoal = await this.createSalesGoalRepository.create(data);
            this.logger.log(`Sales goal created`, CreateSalesGoalUseCase.name);
            return salesGoal;
        } catch (err) {
            if (err.code === 'P2002') {
                this.logger.warn('Conflito de Meta detectado (P2002):', { newGoal: data });
                throw new ConflictException('Já existe uma meta para este período nesta loja (Datas e Tipo idênticos).');
            }
            if (err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
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
