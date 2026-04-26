import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { UpdateServiceVariantDto } from "../dto/update-service-variant.dto";
import { FindServiceVariantByIdRepository, UpdateServiceVariantRepository } from "../repository";
import { FindServiceByIdRepository } from "src/modules/service/repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class UpdateServiceVariantUseCase {
  constructor(
    private readonly findByIdRepository: FindServiceVariantByIdRepository,
    private readonly updateRepository: UpdateServiceVariantRepository,
    private readonly findServiceByIdRepository: FindServiceByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateServiceVariantDto, user: JwtPayload) {
    try {
      const existing = await this.findByIdRepository.findById(id, user);
      if (!existing) {
        throw new NotFoundException('Service variant not found');
      }

      if (data.serviceId) {
        const service = await this.findServiceByIdRepository.findById(data.serviceId, user);
        if (!service) {
          throw new NotFoundException('Service not found');
        }
      }

      return await this.updateRepository.update(id, data);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if ((err as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Variant for this size already exists in this service');
      }

      const error = new ServiceUnavailableException('Something bad happened!', {
        cause: err,
        description: 'Error updating service variant',
      });
      this.logger.error(error.message, (err as Error)?.stack, UpdateServiceVariantUseCase.name);
      throw error;
    }
  }
}
