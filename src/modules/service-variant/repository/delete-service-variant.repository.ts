import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class DeleteServiceVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: string) {
    return this.prisma.serviceVariant.delete({
      where: { id },
    });
  }
}
