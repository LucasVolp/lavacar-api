import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateShopDto } from "../dto/create-shop.dto";

interface CreateShopData extends CreateShopDto {
    slug: string;
}

@Injectable()
export class CreateShopRepository {
    constructor(private readonly prisma: PrismaService){}

    async create(data: CreateShopData) {
        return await this.prisma.shop.create({
            data,
        });
    }
}