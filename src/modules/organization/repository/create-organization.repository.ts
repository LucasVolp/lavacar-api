import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateOrganizationDto } from '../dto';
import { generateSlug } from 'src/shared/utils';

@Injectable()
export class CreateOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateOrganizationDto) {
        const slug = generateSlug(data.name);

        return await this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    ...data,
                    slug,
                    members: {
                        create: {
                            userId: data.ownerId,
                            role: 'OWNER',
                        },
                    },
                },
            });

            await tx.user.updateMany({
                where: {
                    id: data.ownerId,
                    NOT: { role: 'ADMIN' },
                },
                data: { role: 'OWNER' },
            });

            return organization;
        });
    }
}
