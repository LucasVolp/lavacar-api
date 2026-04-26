import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DeleteServiceVariantRepository, FindServiceVariantByIdRepository } from "../repository";
import { JwtPayload } from "src/shared/types/jwt-payload.interface";

@Injectable()
export class DeleteServiceVariantUseCase {
  constructor(
    private readonly findByIdRepository: FindServiceVariantByIdRepository,
    private readonly deleteRepository: DeleteServiceVariantRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, user: JwtPayload) {
    try {
      const existing = await this.findByIdRepository.findById(id, user);
      if (!existing) {
        throw new NotFoundException('Service variant not found');
      }

      return await this.deleteRepository.delete(id);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const error = new ServiceUnavailableException('Something bad happened!', {
        cause: err,
        description: 'Error deleting service variant',
      });
      this.logger.error(error.message, (err as Error)?.stack, DeleteServiceVariantUseCase.name);
      throw error;
    }
  }
}
