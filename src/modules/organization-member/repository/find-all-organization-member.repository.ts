import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindAllOrganizationMemberRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.organizationMember.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                organization: true,
                managedShops: {
                    include: {
                        shop: true,
                    },
                },
            },
        });
    }

    async findByOrganizationId(organizationId: string) {
        return await this.prisma.organizationMember.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                organization: true,
                managedShops: {
                    include: {
                        shop: true,
                    },
                },
            },
        });
    }
}
