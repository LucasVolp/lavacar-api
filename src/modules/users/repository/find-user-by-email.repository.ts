import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserByEmailRepository {
    constructor(private readonly prisma: PrismaService){}

    async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: {email}
        });
    }
}