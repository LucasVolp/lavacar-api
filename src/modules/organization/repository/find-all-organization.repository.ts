import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindAllOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.organization.findMany({
            include: {
                shops: true,
                members: {
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
