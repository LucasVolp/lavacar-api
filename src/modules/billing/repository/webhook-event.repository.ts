import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class WebhookEventRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.webhookEvent.findUnique({ where: { id } });
    }

    async findByAsaasId(asaasEventId: string) {
        return await this.prisma.webhookEvent.findUnique({ where: { asaasEventId } });
    }

    async create(data: { asaasEventId: string; event: string; payload: object }) {
        return await this.prisma.webhookEvent.create({
            data: {
                asaasEventId: data.asaasEventId,
                event: data.event,
                payload: data.payload,
                status: "PENDING",
            },
        });
    }

    async markProcessed(id: string) {
        return await this.prisma.webhookEvent.update({
            where: { id },
            data: { status: "PROCESSED", processedAt: new Date() },
        });
    }

    async markFailed(id: string, error: string) {
        return await this.prisma.webhookEvent.update({
            where: { id },
            data: { status: "FAILED", error },
        });
    }
}
