import { Global, Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from './databases/prisma.database';
import { SubscriptionGuard } from 'src/guards/subscription.guard';

@Global()
@Module({
  imports: [],
  providers: [PrismaService, Logger, SubscriptionGuard],
  exports: [PrismaService, SubscriptionGuard],
})
export class SharedModule {}
