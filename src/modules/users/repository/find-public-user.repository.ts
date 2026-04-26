import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindPublicUserRepository {
    constructor (
        private readonly prisma: PrismaService,
    ) {}

    async findPublicUser(phone: string) {
        const user = await this.prisma.user.findUnique({
            where: {phone},
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                isGuest: true,
                isActive: true,
                vehicles: {
                    select: {
                        id: true,
                        plate: true,
                        model: true,
                        brand: true,
                        color: true,
                        year: true,
                        size: true,
                        type: true,
                        isActive: true,
                    }
                }
            }
        });
        return user;
    }
}