import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindEvaluationByIdRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return await this.prisma.evaluation.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                appointment: {
                    include: {
                        services: true,
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
