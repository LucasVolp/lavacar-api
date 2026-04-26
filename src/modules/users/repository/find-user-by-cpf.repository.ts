import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserByCpfRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByCpf(cpf: string) {
        return await this.prisma.user.findUnique({
            where: { cpf },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                cpf: true,
                picture: true,
                role: true,
                isActive: true,
                isGuest: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
}
