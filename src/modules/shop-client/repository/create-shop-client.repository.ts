import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateShopClientDto } from '../dto/create-shop-client.dto';

@Injectable()
export class CreateShopClientRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateShopClientDto) {
        return await this.prisma.shopClient.create({
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
