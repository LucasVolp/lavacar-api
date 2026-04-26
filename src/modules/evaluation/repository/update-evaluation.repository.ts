import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateEvaluationDto } from "../dto/update-evaluation.dto";

@Injectable()
export class UpdateEvaluationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateEvaluationDto) {
        return await this.prisma.evaluation.update({
            where: { id },
            data,
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
            }
        });
    }
}
