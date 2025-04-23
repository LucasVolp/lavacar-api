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
import { ServiceModule } from './modules/service/service.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/role.guard';
import { VehicleModule } from './modules/vehicle/vehicle.module';

@Module({
  imports: [UsersModule, AuthModule, ShopModule, ServiceModule, VehicleModule],
  controllers: [AppController],
  providers: [AppService, {provide: APP_GUARD, useClass: RolesGuard}, JwtService, JwtStrategy, Logger, AuthService, GoogleStrategy],
})
export class AppModule {}
