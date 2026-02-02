import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';

@Injectable()
export class UpdateChecklistRepository {
    constructor(private readonly prisma: PrismaService) {}

    async update(id: string, data: UpdateChecklistDto) {
        // Remove appointmentId from data to prevent updates on relation
        const { appointmentId, ...updateData } = data;
        return await this.prisma.checklist.update({
            where: { id },
            data: updateData,
            include: {
                appointment: true,
            },
        });
    }
}
