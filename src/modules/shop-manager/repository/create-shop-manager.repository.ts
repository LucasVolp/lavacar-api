import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateShopManagerDto } from '../dto';

@Injectable()
export class CreateShopManagerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateShopManagerDto) {
        return await this.prisma.shopManager.create({
            data,
            include: {
                shop: true,
                member: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                picture: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
