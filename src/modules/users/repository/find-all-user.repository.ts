import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindAllUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(){
        return await this.prisma.user.findMany()
    }
}