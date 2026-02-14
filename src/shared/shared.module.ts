import { Global, Module } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from './databases/prisma.database';

@Global()
@Module({
  imports: [],
  providers: [PrismaService, Logger],
  exports: [PrismaService],
})
export class SharedModule {}
