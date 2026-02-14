import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindShopBySlugRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findBySlug(slug: string) {
        return await this.prisma.shop.findFirst({
            where: { slug, status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                phone: true,
                email: true,
                status: true,
                logoUrl: true,
                bannerUrl: true,
                socialLinks: true,
                zipCode: true,
                street: true,
                number: true,
                complement: true,
                neighborhood: true,
                city: true,
                state: true,
                timeZone: true,
                slotInterval: true,
                bufferBetweenSlots: true,
                maxAdvanceDays: true,
                minAdvanceMinutes: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findAllSlugs(): Promise<string[]> {
        const shops = await this.prisma.shop.findMany({
            select: { id: true, slug: true },
        });
        return shops.map(shop => shop.slug);
    }
}
