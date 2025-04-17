import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateUserInput } from "../input/create-user.input";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";

@Injectable()
export class CreateUserRepository {
    private readonly saltRounds = 10;
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateUserInput): Promise<User> {
        const createHash = await bcrypt.hash(data.password, this.saltRounds);

        return await this.prisma.user.create({
            data: {
                ...data,
                password: createHash,
            },
        });
    }
}