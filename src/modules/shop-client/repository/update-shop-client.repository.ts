import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateShopClientDto } from '../dto/update-shop-client.dto';

@Injectable()
export class UpdateShopClientRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateShopClientDto) {
        return await this.prisma.shopClient.update({
            where: { id },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        picture: true,
                    },
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}
