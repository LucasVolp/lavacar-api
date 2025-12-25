import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateEvaluationDto } from "../dto/create-evaluation.dto";

@Injectable()
export class CreateEvaluationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateEvaluationDto) {
        return await this.prisma.evaluation.create({
            data,
            include: {
                appointment: {
                    include: {
                        shop: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        vehicle: true
                    }
                },
            },
        });
    }
}
