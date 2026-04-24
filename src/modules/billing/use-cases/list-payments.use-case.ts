import { Injectable } from "@nestjs/common";
import { AsaasService } from "../services/asaas.service";

@Injectable()
export class ListPaymentsUseCase {
    constructor(private readonly asaasService: AsaasService) {}

    async execute(filters?: { subscription?: string; status?: string; offset?: number; limit?: number }) {
        return await this.asaasService.listPayments(filters);
    }
}
