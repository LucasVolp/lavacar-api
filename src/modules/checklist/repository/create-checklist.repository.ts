import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { CreateChecklistDto } from '../dto/create-checklist.dto';

@Injectable()
export class CreateChecklistRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateChecklistDto) {
        return await this.prisma.checklist.create({
            data,
            include: {
                appointment: true,
            },
        });
    }
}
