import { Injectable } from "@nestjs/common";
import { Role } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class UpdateUserRoleRepository {
    constructor(private readonly prisma: PrismaService) {}

    async updateRole(userId: string, role: Role) {
        return await this.prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                role: true,
            },
        });
    }
}
