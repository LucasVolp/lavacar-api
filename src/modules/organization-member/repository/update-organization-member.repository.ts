import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateOrganizationMemberDto } from '../dto';

@Injectable()
export class UpdateOrganizationMemberRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateOrganizationMemberDto) {
        return await this.prisma.organizationMember.update({
            where: { id },
            data,
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
            },
        });
    }
}
