import { forwardRef, Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { JwtStrategy } from 'src/shared/strategies/jwt.strategy';
import { GoogleStrategy } from 'src/shared/strategies/google.strategy'; // Descomentado
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as JwtSignOptions,
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, 
    GoogleStrategy, // Descomentado
    Logger, 
    JwtStrategy],
})
export class AuthModule {}
