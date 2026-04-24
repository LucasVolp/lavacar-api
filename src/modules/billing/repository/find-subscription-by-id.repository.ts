import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindSubscriptionByIdRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async findById (id: string) {
        return this.prisma.subscriptions.findUnique({
            where: { id }
        })
    }
}