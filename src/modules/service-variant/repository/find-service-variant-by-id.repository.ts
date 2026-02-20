import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";
import { buildShopScope } from "src/shared/security/shop-scope.util";

@Injectable()
export class FindServiceVariantByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, user: JwtPayload) {
    const scope = await buildShopScope(this.prisma, user);

    return this.prisma.serviceVariant.findFirst({
      where: {
        id,
        service: {
          ...scope,
        },
      },
      include: {
        service: {
          include: {
            shop: true,
          },
        },
      },
    });
  }
}
