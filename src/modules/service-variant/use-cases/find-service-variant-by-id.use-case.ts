import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { FindServiceVariantByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class FindServiceVariantByIdUseCase {
  constructor(
    private readonly findByIdRepository: FindServiceVariantByIdRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, user: JwtPayload) {
    try {
      const variant = await this.findByIdRepository.findById(id, user);
      if (!variant) {
        throw new NotFoundException('Service variant not found');
      }
      return variant;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const error = new ServiceUnavailableException('Something bad happened!', {
        cause: err,
        description: 'Error finding service variant by id',
      });
      this.logger.error(error.message, (err as Error)?.stack, FindServiceVariantByIdUseCase.name);
      throw error;
    }
  }
}
