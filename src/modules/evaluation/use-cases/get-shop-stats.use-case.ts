import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllEvaluationRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class GetShopStatsUseCase {
    constructor(
        private readonly evaluationRepository: FindAllEvaluationRepository,
        private readonly logger: Logger = new Logger()
    ) {}

    async execute(shopId: string, user: JwtPayload) {
        try {
            const stats = await this.evaluationRepository.getShopStats(shopId, user);
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

    async executePublic(shopId: string) {
        try {
            const stats = await this.evaluationRepository.getPublicShopStats(shopId);
            this.logger.log(`Public shop stats retrieved for: ${shopId}`, GetShopStatsUseCase.name);
            return stats;
        } catch (err) {
            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error getting public shop stats',
            });
            this.logger.error(error.message, err.stack, GetShopStatsUseCase.name);
            throw error;
        }
    }
}
