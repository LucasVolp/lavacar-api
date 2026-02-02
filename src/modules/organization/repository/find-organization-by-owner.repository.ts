import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindOrganizationByOwnerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByOwnerId(ownerId: string) {
        return this.prisma.organization.findFirst({
            where: {
                ownerId,
            },
        });
    }
}