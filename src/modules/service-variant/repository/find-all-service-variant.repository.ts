import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/generated";
import { PrismaService } from "src/shared/databases/prisma.database";
import { buildShopScope } from "src/shared/security/shop-scope.util";
import { PaginatedResult } from "src/shared/dto/pagination.dto";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

interface FindAllFilters {
  serviceId?: string;
  shopId?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class FindAllServiceVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FindAllFilters = {}, user: JwtPayload): Promise<PaginatedResult<any>> {
    const page = filters.page || 1;
    const perPage = filters.perPage || 10;
    const skip = (page - 1) * perPage;

    const scope = await buildShopScope(this.prisma, user, filters.shopId);

    const where: Prisma.ServiceVariantWhereInput = {
      service: {
        ...(scope as Prisma.ServiceWhereInput),
      },
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.serviceVariant.findMany({
        where,
        skip,
        take: perPage,
        include: {
          service: {
            include: {
              shop: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.serviceVariant.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
