import { Injectable, Logger } from "@nestjs/common";
import { ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { timingSafeEqual } from "crypto";

type AsaasMode = "sandbox" | "production";

interface AsaasConfig {
    apiKey: string;
    baseUrl: string;
    webhookToken: string;
}

@Injectable()
export class AsaasService {
    private readonly logger = new Logger(AsaasService.name);
    private readonly api: AxiosInstance;
    private readonly config: AsaasConfig;

    constructor() {
        this.config = AsaasService.resolveConfig();
        this.logger.log(`AsaasService initialized in [${AsaasService.resolveMode()}] mode`);

        const baseUrl = this.config.baseUrl.endsWith("/v3")
            ? this.config.baseUrl
            : `${this.config.baseUrl}/v3`;

        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                "Content-Type": "application/json",
                "access_token": this.config.apiKey,
            },
        });

        this.api.interceptors.request.use((config) => {
            config.headers["access_token"] = this.config.apiKey;
            return config;
        });
    }

    private static resolveMode(): AsaasMode {
        const mode = process.env.ASAAS_MODE;
        if (mode !== "sandbox" && mode !== "production") {
            throw new Error(
                `ASAAS_MODE must be "sandbox" or "production", got: "${mode ?? "(unset)"}"`,
            );
        }
        return mode;
    }

    private static resolveConfig(): AsaasConfig {
        const mode = AsaasService.resolveMode();

        if (mode === "production") {
            const apiKey = process.env.ASAAS_API_PRODUCTION_KEY;
            const baseUrl = process.env.ASAAS_API_PRODUCTION_URL;
            const webhookToken = process.env.ASAAS_WEBHOOK_PRODUCTION_TOKEN;

            const missing = [
                !apiKey && "ASAAS_API_PRODUCTION_KEY",
                !baseUrl && "ASAAS_API_PRODUCTION_URL",
                !webhookToken && "ASAAS_WEBHOOK_PRODUCTION_TOKEN",
            ].filter(Boolean);

            if (missing.length > 0) {
                throw new Error(
                    `Missing required production env vars: ${missing.join(", ")}`,
                );
            }

            return { apiKey: apiKey!, baseUrl: baseUrl!, webhookToken: webhookToken! };
        }

        // sandbox
        const apiKey = process.env.ASAAS_API_SANDBOX_KEY;
        const baseUrl = process.env.ASAAS_API_SANDBOX_URL;
        const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

        const missing = [
            !apiKey && "ASAAS_API_SANDBOX_KEY",
            !baseUrl && "ASAAS_API_SANDBOX_URL",
            !webhookToken && "ASAAS_WEBHOOK_TOKEN",
        ].filter(Boolean);

        if (missing.length > 0) {
            throw new Error(
                `Missing required sandbox env vars: ${missing.join(", ")}`,
            );
        }

        return { apiKey: apiKey!, baseUrl: baseUrl!, webhookToken: webhookToken! };
    }

    /**
     * Validates the webhook token using a constant-time comparison
     * to prevent timing attacks. Throws UnauthorizedException on failure.
     */
    validateWebhookToken(receivedToken: string | undefined): void {
        const expected = this.config.webhookToken;

        if (!receivedToken) {
            throw new UnauthorizedException("Webhook token ausente");
        }

        let tokensMatch: boolean;
        try {
            const expectedBuf = Buffer.from(expected, "utf8");
            const receivedBuf = Buffer.from(receivedToken, "utf8");
            tokensMatch =
                expectedBuf.length === receivedBuf.length &&
                timingSafeEqual(expectedBuf, receivedBuf);
        } catch {
            tokensMatch = false;
        }

        if (!tokensMatch) {
            throw new UnauthorizedException("Token de webhook inválido");
        }
    }

    private getErrorMessage(error: unknown): string {
        if (axios.isAxiosError(error)) {
            return error.response?.data?.errors?.[0]?.description ?? error.message;
        }
        return error instanceof Error ? error.message : "Unknown error";
    }

    async createCustomer(
        data: { name: string; cpfCnpj: string; email: string; mobilePhone: string },
        idempotencyKey?: string,
    ) {
        try {
            const response = await this.api.post("/customers", data, {
                headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
            });
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error creating Asaas customer: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to create customer in payment gateway");
        }
    }

    async createSubscription(
        data: { customer: string; billingType: string; cycle: string; value: number },
        idempotencyKey?: string,
    ) {
        try {
            const response = await this.api.post("/subscriptions", data, {
                headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
            });
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error creating Asaas subscription: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to create subscription in payment gateway");
        }
    }

    async getSubscription(subscriptionId: string) {
        try {
            const response = await this.api.get(`/subscriptions/${subscriptionId}`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error fetching Asaas subscription ${subscriptionId}: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to fetch subscription from payment gateway");
        }
    }

    async updateSubscriptionBillingType(
        subscriptionId: string,
        billingType: string,
        idempotencyKey?: string,
    ) {
        try {
            const response = await this.api.put(
                `/subscriptions/${subscriptionId}`,
                { billingType },
                { headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {} },
            );
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error updating Asaas subscription: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to update subscription in payment gateway");
        }
    }

    async getSubscriptionPayments(subscriptionId: string) {
        try {
            const response = await this.api.get(`/subscriptions/${subscriptionId}/payments`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error fetching Asaas payments: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to fetch payments from payment gateway");
        }
    }

    async getPixQrCode(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error fetching Asaas PIX code: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to fetch PIX QR code from payment gateway");
        }
    }

    async cancelSubscription(subscriptionId: string) {
        try {
            const response = await this.api.delete(`/subscriptions/${subscriptionId}`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error cancelling Asaas subscription ${subscriptionId}: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to cancel subscription in payment gateway");
        }
    }

    async listPayments(filters?: {
        subscription?: string;
        status?: string;
        offset?: number;
        limit?: number;
    }) {
        try {
            const response = await this.api.get("/payments", { params: filters });
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error listing Asaas payments: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to list payments from payment gateway");
        }
    }

    async getPayment(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error fetching Asaas payment ${paymentId}: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to fetch payment from payment gateway");
        }
    }

    async getPaymentStatus(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/status`);
            return response.data;
        } catch (error: unknown) {
            this.logger.error(`Error fetching Asaas payment status ${paymentId}: ${this.getErrorMessage(error)}`);
            throw new ServiceUnavailableException("Failed to fetch payment status from payment gateway");
        }
    }
}
