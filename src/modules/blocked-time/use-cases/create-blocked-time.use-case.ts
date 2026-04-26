import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateBlockedTimeDto } from '../dto/create-blocked-time.dto';
import { CreateBlockedTimeRepository, FindBlockedTimeByShopIdRepository } from '../repository';
import { timeToMinutes } from 'src/shared/utils';
import { BlockedTimeType } from '../types/BlockedTimeType';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { buildShopScope } from 'src/shared/security/shop-scope.util';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class CreateBlockedTimeUseCase {
    constructor(
        private readonly blockedTimeRepository: CreateBlockedTimeRepository,
        private readonly findblockedTimeRepository: FindBlockedTimeByShopIdRepository,
        private readonly prisma: PrismaService,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateBlockedTimeDto, user: JwtPayload) {
        try {
            await buildShopScope(this.prisma, user, data.shopId);
            const shop = await this.prisma.shop.findUnique({
                where: { id: data.shopId },
                select: { timeZone: true },
            });
            const shopTimeZone = shop?.timeZone || 'America/Sao_Paulo';

            if (data.type === BlockedTimeType.PARTIAL) {
                if (!data.startTime || !data.endTime) {
                    this.logger.warn('startTime and endTime are required for PARTIAL blocked time', CreateBlockedTimeUseCase.name);
                    throw new BadRequestException('startTime and endTime are required for PARTIAL blocked time');
                }

                const startMinutes = timeToMinutes(data.startTime);
                const endMinutes = timeToMinutes(data.endTime);

                if (endMinutes <= startMinutes) {
                    this.logger.warn('endTime must be after startTime', CreateBlockedTimeUseCase.name);
                    throw new BadRequestException('endTime must be after startTime');
                }
            }

            const blockedDate = new Date(`${data.date}T00:00:00.000Z`);
            const blockedTimeExists = await this.findblockedTimeRepository.findByShopAndDate(
                data.shopId,
                blockedDate,
                undefined,
                shopTimeZone,
            );
            
            if (blockedTimeExists) {
                this.logger.warn(`Blocked time already exists for shop ID: ${data.shopId} on date: ${data.date}`, CreateBlockedTimeUseCase.name);
                throw new ConflictException('Blocked time already exists for the given date');
            }

            const todayKey = formatInTimeZone(new Date(), shopTimeZone, 'yyyy-MM-dd');
            if (data.date < todayKey) {
                this.logger.warn('Cannot block a date in the past', CreateBlockedTimeUseCase.name);
                throw new BadRequestException('Cannot block a date in the past');
            }

            const blockedTime = await this.blockedTimeRepository.create({
                ...data,
                date: blockedDate,
            });

            this.logger.log(`Blocked time created for ${data.date}`, CreateBlockedTimeUseCase.name);
            return blockedTime;
        } catch (err) {
            if (err instanceof BadRequestException || err instanceof ConflictException) {
                throw err;
            }

            const error = new ServiceUnavailableException('Something bad happened!', {
                cause: err,
                description: 'Error creating blocked time',
            });
            this.logger.error(error.message, err.stack, CreateBlockedTimeUseCase.name);
            throw error;
        }
    }
}
