import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    picture: true,
    role: true,
} as const;

@Injectable()
export class FindOrganizationMembersByShopRepository {
    constructor (
        private readonly prisma: PrismaService
    ) {}

    async findByShopId(shopId: string) {
        const shop = await this.prisma.shop.findUnique({
            where: { id: shopId },
            select: { ownerId: true, organizationId: true },
        });

        if (!shop) return [];

        return this.prisma.organizationMember.findMany({
            where: {
                organizationId: shop.organizationId,
                OR: [
                    { managedShops: { some: { shopId } } },
                    ...(shop.ownerId ? [{ userId: shop.ownerId }] : []),
                ],
            },
            include: {
                user: { select: userSelect },
            },
        });
    }
}