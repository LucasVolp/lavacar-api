import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindShopBySlugRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findBySlug(slug: string) {
        return await this.prisma.shop.findUnique({
            where: { slug },
            include: {
                serviceGroups: {
                    select: {
                        name: true,
                        services: true,
                    }
                },
                organization: true,
                owner: true,
                schedules: true,
                blockedTimes: true,
                appointments: true,
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
