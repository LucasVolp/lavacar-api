import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UpdateUserRepository {
    constructor(private readonly prisma: PrismaService){}

    async update(id: string, data: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: {id},
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
                vehicles: true,
                appointments: {
                    select: {
                        id: true,
                        scheduledAt: true,
                        endTime: true,
                        status: true,
                        totalPrice: true,
                        totalDuration: true,
                        shopId: true,
                        vehicleId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                shops: true,
            },
        });
        return user;
    }
}
