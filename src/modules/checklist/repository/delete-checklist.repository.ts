import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';

@Injectable()
export class DeleteChecklistRepository {
    constructor(private readonly prisma: PrismaService) {}

    async delete(id: string) {
        return await this.prisma.checklist.delete({
            where: { id },
        });
    }
}
