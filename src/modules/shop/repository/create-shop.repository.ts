import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateShopDto } from "../dto/create-shop.dto";

interface CreateShopData extends CreateShopDto {
    slug: string;
}

@Injectable()
export class CreateShopRepository {
    constructor(private readonly prisma: PrismaService){}

    async create(data: CreateShopData) {
        const createData: Prisma.ShopUncheckedCreateInput = {
            ...data,
            socialLinks: data.socialLinks as Prisma.InputJsonValue | undefined,
        };

        return await this.prisma.shop.create({
            data: createData,
        });
    }
}
