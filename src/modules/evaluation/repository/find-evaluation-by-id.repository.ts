import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope, isAdminRole } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindEvaluationByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string, user?: JwtPayload) {
        if (!user) {
            return await this.prisma.evaluation.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            picture: true,
                        }
                    },
                    appointment: {
                        include: {
                            services: true,
                            vehicle: true,
                            shop: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            },
                        }
                    },
                },
            });
        }

        const where: any = { id };
        if (user.role === 'USER') {
            where.userId = user.id;
        } else if (!isAdminRole(user.role)) {
            const scope = await buildShopScope(this.prisma, user);
            where.appointment = scope;
        }

        return await this.prisma.evaluation.findFirst({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        picture: true,
                    }
                },
                appointment: {
                    include: {
                        services: true,
                        vehicle: true,
                        shop: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                    }
                },
            },
        });
    }

    async findByAppointmentId(appointmentId: string) {
        return await this.prisma.evaluation.findUnique({
            where: { appointmentId },
        });
    }
}
