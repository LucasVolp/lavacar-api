import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FindOrganizationDashboardMetricsRepository,
  OrganizationDashboardMetricsFilters,
} from '../repository';

@Injectable()
export class FindOrganizationDashboardMetricsUseCase {
  constructor(
    private readonly repository: FindOrganizationDashboardMetricsRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(organizationId: string, filters: OrganizationDashboardMetricsFilters = {}) {
    try {
      const metrics = await this.repository.findOrganizationDashboardMetrics(
        organizationId,
        filters,
      );

      if (!metrics) {
        this.logger.warn(
          `Organization with id ${organizationId} not found`,
          FindOrganizationDashboardMetricsUseCase.name,
        );
        throw new NotFoundException('Organization not found!');
      }

      this.logger.log(
        `Organization dashboard metrics generated: ${organizationId}`,
        FindOrganizationDashboardMetricsUseCase.name,
      );

      return metrics;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      const error = new ServiceUnavailableException({
        message: 'Error generating organization dashboard metrics',
        cause: err,
        description: 'Error generating organization dashboard metrics',
      });

      this.logger.error(
        error.message,
        err instanceof Error ? err.stack : undefined,
        FindOrganizationDashboardMetricsUseCase.name,
      );
      throw error;
    }
  }
}
