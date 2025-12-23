import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllEvaluationRepository } from "../repository";

@Injectable()
export class GetShopStatsUseCase {
    constructor(
        private readonly evaluationRepository: FindAllEvaluationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(shopId: string) {
        try {
            const stats = await this.evaluationRepository.getShopStats(shopId);
            this.logger.log(`Shop stats retrieved for: ${shopId}`, GetShopStatsUseCase.name);
            return stats;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error getting shop stats',
            });
            this.logger.error(error.message, err.stack, GetShopStatsUseCase.name);
            throw error;
        }
    }
}
