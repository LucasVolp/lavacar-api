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
        });
    }
}
