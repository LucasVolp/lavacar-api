import { Injectable } from "@nestjs/common";
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateUserInput } from "../input/create-user.input";

@Injectable()
export class CreateUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateUserInput) {
        return await this.prisma.user.create({
            data,
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
