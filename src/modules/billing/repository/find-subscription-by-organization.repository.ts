import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindSubscriptionByOrganizationRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async findByOrganizationId (organizationId: string) {
        return await this.prisma.subscriptions.findFirst({
            where: {
                organizationId: organizationId,
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }   
}