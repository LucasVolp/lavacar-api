import { forwardRef, Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { JwtStrategy } from 'src/shared/strategies/jwt.strategy';
import { GoogleStrategy } from 'src/shared/strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import * as Repositories from './repository';
import * as UseCases from './use-cases';
import * as fs from 'fs';

const repositories = Object.values(Repositories);
const usecases = Object.values(UseCases);

@Module({
  imports: [
    JwtModule.register({
      privateKey: fs.readFileSync('private.key'),
      publicKey: fs.readFileSync('public.key'),
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d', algorithm: 'RS256' } as JwtSignOptions,
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    Logger,
    JwtStrategy,
    ...repositories,
    ...usecases,
  ],
  exports: [AuthService],
})
export class AuthModule {}
