import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateShopDto } from "../dto/update-shop.dto";

@Injectable()
export class UpdateShopRepository{
    constructor(private readonly prisma: PrismaService){}

    async update(id: string, data: UpdateShopDto) {
        const uniqueGallery = data.gallery ? Array.from(new Set(data.gallery)) : undefined;
        const updateData: Prisma.ShopUncheckedUpdateInput = {
            ...data,
            socialLinks: data.socialLinks as Prisma.InputJsonValue | undefined,
            gallery: uniqueGallery ? { set: uniqueGallery } : undefined,
        };

        return await this.prisma.shop.update({
            where: {id},
            data: updateData,
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
        })
    }
}
