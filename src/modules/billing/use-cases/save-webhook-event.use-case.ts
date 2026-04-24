import { Injectable, Logger } from "@nestjs/common";
import { AsaasWebhookDto } from "../dto/webhook.dto";
import { WebhookEventRepository } from "../repository";

@Injectable()
export class SaveWebhookEventUseCase {
    private readonly logger = new Logger(SaveWebhookEventUseCase.name);

    constructor(private readonly webhookEventRepository: WebhookEventRepository) {}

    async execute(dto: AsaasWebhookDto) {
        const asaasEventId = this.resolveEventId(dto);

        if (!asaasEventId) {
            this.logger.warn(`Cannot determine idempotency key for event: ${dto.event}`);
            return null;
        }

        const existing = await this.webhookEventRepository.findByAsaasId(asaasEventId);
        if (existing) {
            this.logger.log(`Duplicate webhook event ignored: ${asaasEventId} (${dto.event})`);
            return null;
        }

        const saved = await this.webhookEventRepository.create({
            asaasEventId,
            event: dto.event,
            payload: dto as unknown as object,
        });

        this.logger.log(`Webhook event saved: ${saved.id} — ${dto.event} (${asaasEventId})`);
        return saved;
    }

    private resolveEventId(dto: AsaasWebhookDto): string | null {
        if (dto.payment?.id) {
            return `${dto.payment.id}_${dto.event}`;
        }
        if (dto.subscription?.id) {
            return `${dto.subscription.id}_${dto.event}`;
        }
        return null;
    }
}
