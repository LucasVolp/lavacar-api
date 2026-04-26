import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateServiceVariantDto } from "../dto/create-service-variant.dto";

@Injectable()
export class CreateServiceVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateServiceVariantDto) {
    return this.prisma.serviceVariant.create({
      data,
      include: { service: true },
    });
  }
}
