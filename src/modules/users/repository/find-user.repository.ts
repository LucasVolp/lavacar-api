import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserRepository {
    constructor(private readonly prisma: PrismaService){}

    async findById(id: string) {
        return await this.prisma.user.findUnique({
            where: { id }
        });
    }
}