import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateOrganizationDto } from '../dto';
import { generateSlug } from 'src/shared/utils';

@Injectable()
export class UpdateOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateOrganizationDto) {
        const updateData: UpdateOrganizationDto & { slug?: string } = { ...data };

        if (data.name) {
            updateData.slug = generateSlug(data.name);
        }

        return await this.prisma.organization.update({
            where: { id },
            data: updateData,
        });
    }
}
