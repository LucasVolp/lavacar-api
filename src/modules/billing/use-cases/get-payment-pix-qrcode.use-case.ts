import { Injectable } from "@nestjs/common";
import { AsaasService } from "../services/asaas.service";

@Injectable()
export class GetPaymentPixQrCodeUseCase {
    constructor(private readonly asaasService: AsaasService) {}

    async execute(paymentId: string) {
        return await this.asaasService.getPixQrCode(paymentId);
    }
}
