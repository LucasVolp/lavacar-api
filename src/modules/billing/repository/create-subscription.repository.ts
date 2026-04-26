import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";

@Injectable()
export class CreateSubscriptionRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async create(data: CreateSubscriptionDto) {
        return await this.prisma.subscriptions.create({
            data
        })
    }
}