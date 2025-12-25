import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserByCpfRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByCpf(cpf: string) {
        return await this.prisma.user.findUnique({
            where: { cpf },
            include: {
                vehicles: true,
                appointments: true,
                shops: true
            }
        });
    }
}