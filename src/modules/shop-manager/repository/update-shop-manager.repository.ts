import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateShopManagerDto } from '../dto';

@Injectable()
export class UpdateShopManagerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateShopManagerDto) {
        return await this.prisma.shopManager.update({
            where: { id },
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
                            },
                        },
                    },
                },
            },
        });
    }
}
