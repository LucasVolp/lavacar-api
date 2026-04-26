import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";

@Injectable()
export class FindShopByDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDocumentOutsideOrganization(
    document: string,
    organizationId: string,
    excludeShopId?: string
  ) {
    return await this.prisma.shop.findFirst({
      where: {
        document,
        organizationId: { not: organizationId },
        ...(excludeShopId ? { id: { not: excludeShopId } } : {}),
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });
  }
}

