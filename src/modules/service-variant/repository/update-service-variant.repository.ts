import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { UpdateServiceVariantDto } from "../dto/update-service-variant.dto";

@Injectable()
export class UpdateServiceVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: string, data: UpdateServiceVariantDto) {
    return this.prisma.serviceVariant.update({
      where: { id },
      data,
      include: { service: true },
    });
  }
}
