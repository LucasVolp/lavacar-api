import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope, isAdminRole } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindAppointmentByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
            return await this.prisma.appointment.findUnique({
                where: { id },
                include: {
                    services: true,
                    vehicle: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            picture: true,
                        }
                    },
                    shop: true,
                    evaluation: true,
                },
            });
        }

        const where: any = { id };

        if (user.role === 'USER') {
            where.userId = user.id;
        } else if (!isAdminRole(user.role)) {
            const scope = await buildShopScope(this.prisma, user);
            Object.assign(where, scope);
        }

        return await this.prisma.appointment.findFirst({
            where,
            include: {
                services: true,
                vehicle: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        picture: true,
                    }
                },
                shop: true,
                evaluation: true,
            },
        });
    }
}
