import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateUserInput } from "../input/create-user.input";

@Injectable()
export class CreateUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateUserInput) {
        return await this.prisma.user.create({
            data,
        });
    }
}