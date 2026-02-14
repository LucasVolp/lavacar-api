import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class FindOrganizationByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.organization.findUnique({
            where: { id },
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
                                picture: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findBySlug(slug: string) {
        return await this.prisma.organization.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findByDocument(document: string) {
        return await this.prisma.organization.findUnique({
            where: { document },
        });
    }
}
