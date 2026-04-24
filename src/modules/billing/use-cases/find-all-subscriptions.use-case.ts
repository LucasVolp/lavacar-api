import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllSubscriptionsRepository } from "../repository";

@Injectable()
export class FindAllSubscriptionsUseCase {
    private readonly logger = new Logger(FindAllSubscriptionsUseCase.name);

    constructor (
        private readonly findAllSubscriptions: FindAllSubscriptionsRepository
    ) {}

    async execute (organizationId?: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const take = limit;

            const [data, total] = await Promise.all([
                this.findAllSubscriptions.findAll(organizationId, skip, take),
                this.findAllSubscriptions.count(organizationId)
            ]);

            return {
                data,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit)
                }
            };
        } catch (err) {
            this.logger.error(`Error finding all subscriptions: ${err.message}`);
            throw new ServiceUnavailableException("Something bad happened while fetching subscriptions");
        }
    }
}
