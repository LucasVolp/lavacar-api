import { Injectable, Logger } from "@nestjs/common";
import { AsaasWebhookDto } from "../dto/webhook.dto";
import { WebhookEventRepository } from "../repository";
import { HandleWebhookUseCase } from "./handle-webhook.use-case";

@Injectable()
export class ProcessWebhookEventUseCase {
    private readonly logger = new Logger(ProcessWebhookEventUseCase.name);

    constructor(
        private readonly webhookEventRepository: WebhookEventRepository,
        private readonly handleWebhook: HandleWebhookUseCase,
    ) {}

    async execute(webhookEventId: string): Promise<void> {
        const event = await this.webhookEventRepository.findById(webhookEventId);
        if (!event) {
            this.logger.error(`WebhookEvent not found: ${webhookEventId}`);
            return;
        }

        try {
            await this.handleWebhook.execute(event.payload as unknown as AsaasWebhookDto);
            await this.webhookEventRepository.markProcessed(event.id);
            this.logger.log(`WebhookEvent processed: ${event.id} — ${event.event}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            await this.webhookEventRepository.markFailed(event.id, message);
            this.logger.error(`WebhookEvent failed: ${event.id} — ${message}`);
        }
    }
}
