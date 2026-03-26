import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './shared/strategies/jwt.strategy';
import { ShopModule } from './modules/shop/shop.module';
import { ServiceModule } from './modules/service/service.module';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { BlockedTimesModule } from './modules/blocked-time/blocked-times.module';
import { ServiceGroupModule } from './modules/service-group/service-group.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { OrganizationMemberModule } from './modules/organization-member/organization-member.module';
import { ShopManagerModule } from './modules/shop-manager/shop-manager.module';
import { SalesGoalModule } from './modules/sales-goal/sales-goal.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { ShopClientModule } from './modules/shop-client/shop-client.module';
import { StorageModule } from './modules/storage/storage.module';
import { ServiceVariantModule } from './modules/service-variant/service-variant.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    StorageModule,
    UsersModule,
    AuthModule,
    ShopModule,
    ServiceModule,
    ServiceGroupModule,
    VehicleModule,
    ScheduleModule,
    BlockedTimesModule,
    AppointmentModule,
    EvaluationModule,
    OrganizationModule,
    OrganizationMemberModule,
    ShopManagerModule,
    SalesGoalModule,
    ChecklistModule,
    ShopClientModule,
    ServiceVariantModule,
    BillingModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    JwtService,
    JwtStrategy,
    Logger,
  ],
})
export class AppModule {}
