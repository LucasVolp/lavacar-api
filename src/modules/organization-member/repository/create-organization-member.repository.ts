import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateOrganizationMemberDto } from '../dto';

@Injectable()
export class CreateOrganizationMemberRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateOrganizationMemberDto) {
        return await this.prisma.organizationMember.create({
            data,
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
            },
        });
    }
}
