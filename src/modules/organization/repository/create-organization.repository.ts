import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateOrganizationDto } from '../dto';
import { generateSlug } from 'src/shared/utils';

@Injectable()
export class CreateOrganizationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateOrganizationDto) {
        const slug = generateSlug(data.name);

        return await this.prisma.organization.create({
            data: {
                ...data,
                slug,
            },
        });
    }
}
