import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './shared/strategies/jwt.strategy';
import { AuthService } from './modules/auth/auth.service';
import { GoogleStrategy } from './shared/strategies/google.strategy';
import { ShopModule } from './modules/shop/shop.module';

@Module({
  imports: [UsersModule, AuthModule, ShopModule],
  controllers: [AppController],
  providers: [AppService, JwtService, JwtStrategy, Logger, AuthService, GoogleStrategy],
})
export class AppModule {}
