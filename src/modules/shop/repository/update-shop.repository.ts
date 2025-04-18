import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateShopDto } from "../dto/update-shop.dto";

@Injectable()
export class UpdateShopRepository{
    constructor(private readonly prisma: PrismaService){}

    async update(id: string, data: UpdateShopDto) {
        return await this.prisma.shop.update({
            where: {id},
            data
        })
    }
}