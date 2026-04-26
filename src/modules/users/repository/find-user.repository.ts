import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserRepository {
    constructor(private readonly prisma: PrismaService){}

    async findById(id: string) {
        return await this.prisma.user.findUnique({
            where: { id },
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
    }
}
