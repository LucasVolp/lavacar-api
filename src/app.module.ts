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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { BlockedTimesModule } from './modules/blocked-time/blocked-times.module';
import { ServiceGroupModule } from './modules/service-group/service-group.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { OrganizationMemberModule } from './modules/organization-member/organization-member.module';
import { ShopManagerModule } from './modules/shop-manager/shop-manager.module';
import { FipeApiModule } from './modules/fipe-api/fipe-api.module';
import { SalesGoalModule } from './modules/sales-goal/sales-goal.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { ShopClientModule } from './modules/shop-client/shop-client.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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
    FipeApiModule,
    SalesGoalModule,
    ChecklistModule,
    ShopClientModule
  ],
  controllers: [AppController],
  providers: [AppService,
    {provide: APP_GUARD, useClass: JwtAuthGuard},
    JwtService,
    JwtStrategy,
    Logger,
    AuthService,
    GoogleStrategy,
  ],
})
export class AppModule {}
