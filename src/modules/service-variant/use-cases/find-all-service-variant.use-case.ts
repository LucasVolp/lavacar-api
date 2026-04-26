import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { FindAllServiceVariantRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class FindAllServiceVariantUseCase {
  constructor(
    private readonly findAllRepository: FindAllServiceVariantRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(filters: { serviceId?: string; shopId?: string; page?: number; perPage?: number }, user: JwtPayload) {
    try {
      return await this.findAllRepository.findAll(filters, user);
    } catch (err) {
      const error = new ServiceUnavailableException('Something bad happened!', {
        cause: err,
        description: 'Error finding service variants',
      });
      this.logger.error(error.message, (err as Error)?.stack, FindAllServiceVariantUseCase.name);
      throw error;
    }
  }
}
