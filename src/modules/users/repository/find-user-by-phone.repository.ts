import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindUserByPhoneRepository {
    constructor (
        private readonly prisma: PrismaService,
    ) {}

    async findByPhone(phone: string) {
        return await this.prisma.user.findUnique({
            where: {phone},
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                picture: true,
                vehicles: {
                    select: {
                        id: true,
                        plate: true,
                        brand: true,
                        model: true,
                        color: true,
                        type: true,
                        size: true,
                    }
                }
            },
        })
    }
}
