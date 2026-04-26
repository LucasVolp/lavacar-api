import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindOrganizationMemberByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.organizationMember.findUnique({
            where: { id },
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
                organization: true,
                managedShops: {
                    include: {
                        shop: true,
                    },
                },
            },
        });
    }

    async findByUserAndOrganization(userId: string, organizationId: string) {
        return await this.prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
    }
}
