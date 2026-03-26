import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class AsaasService {
    private readonly logger = new Logger(AsaasService.name);
    private readonly api: AxiosInstance;
    private readonly apiKey: string;

    constructor() {
        console.log("Initializing AsaasService with API key:", process.env.ASAAS_API_SANDBOX_KEY ? "****" : "MISSING");
        this.apiKey = process.env.ASAAS_API_SANDBOX_KEY || '';
        
        if (!this.apiKey) {
            this.logger.error("ASAAS_API_SANDBOX_KEY is missing in environment variables!");
        }

        const baseUrl = process.env.ASAAS_API_SANDBOX_URL?.endsWith("/v3") 
            ? process.env.ASAAS_API_SANDBOX_URL 
            : `${process.env.ASAAS_API_SANDBOX_URL}/v3`;

        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                "Content-Type": "application/json",
                "access_token": this.apiKey
            }
        });

        // Garantir que o token seja enviado em TODAS as requisições via interceptor
        this.api.interceptors.request.use((config) => {
            config.headers['access_token'] = this.apiKey;
            return config;
        });
    }

    async createCustomer(data: { name: string; cpfCnpj: string; email: string; mobilePhone: string }, idempotencyKey?: string) {
        try {
            const response = await this.api.post("/customers", data, {
                headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {}
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error creating Asaas customer: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to create customer in payment gateway");
        }
    }

    async createSubscription(data: { customer: string; billingType: string; cycle: string; value: number }, idempotencyKey?: string) {
        try {
            const response = await this.api.post("/subscriptions", data, {
                headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {}
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error creating Asaas subscription: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to create subscription in payment gateway");
        }
    }

    async getSubscription(subscriptionId: string) {
        try {
            const response = await this.api.get(`/subscriptions/${subscriptionId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching Asaas subscription ${subscriptionId}: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to fetch subscription from payment gateway");
        }
    }

    async updateSubscriptionBillingType(subscriptionId: string, billingType: string, idempotencyKey?: string) {
        try {
            const response = await this.api.put(`/subscriptions/${subscriptionId}`, { billingType }, {
                headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {}
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating Asaas subscription: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to update subscription in payment gateway");
        }
    }

    async getSubscriptionPayments(subscriptionId: string) {
        try {
            const response = await this.api.get(`/subscriptions/${subscriptionId}/payments`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching Asaas payments: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to fetch payments from payment gateway");
        }
    }

    async getPixQrCode(paymentId: string) {
        try {
            const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error fetching Asaas PIX code: ${error.response?.data?.errors?.[0]?.description || error.message}`);
            throw new ServiceUnavailableException("Failed to fetch PIX QR code from payment gateway");
        }
    }
}
