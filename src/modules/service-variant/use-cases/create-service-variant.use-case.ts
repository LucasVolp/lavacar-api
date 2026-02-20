import { ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CreateServiceVariantDto } from "../dto/create-service-variant.dto";
import { CreateServiceVariantRepository } from "../repository";
import { FindServiceByIdRepository } from "src/modules/service/repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class CreateServiceVariantUseCase {
  constructor(
    private readonly createRepository: CreateServiceVariantRepository,
    private readonly findServiceByIdRepository: FindServiceByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(data: CreateServiceVariantDto, user: JwtPayload) {
    try {
      const service = await this.findServiceByIdRepository.findById(data.serviceId, user);
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      return await this.createRepository.create(data);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if ((err as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Variant for this size already exists in this service');
      }

      const error = new ServiceUnavailableException('Something bad happened!', {
        cause: err,
        description: 'Error creating service variant',
      });
      this.logger.error(error.message, (err as Error)?.stack, CreateServiceVariantUseCase.name);
      throw error;
    }
  }
}
