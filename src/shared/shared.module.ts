import { Global, Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from './databases/prisma.database';
import { OwnershipService } from './services/ownership.service';

@Global()
@Module({
  imports: [],
  providers: [PrismaService, Logger, OwnershipService],
  exports: [PrismaService, OwnershipService],
})
export class SharedModule {}
