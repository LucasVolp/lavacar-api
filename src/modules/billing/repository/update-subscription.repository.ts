import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateBillingDto } from "../dto/update-billing.dto";

@Injectable()
export class UpdateSubscriptionRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async update(id: string, data: UpdateBillingDto) {
        return await this.prisma.subscriptions.update({
            where: {
                id: id
            },
            data
        })
    }
}