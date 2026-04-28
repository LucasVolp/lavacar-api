import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from 'src/guards/subscription.guard';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('schedule')
@UseGuards(SubscriptionGuard)
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  create(@Body() data: CreateScheduleDto, @CurrentUser() user: JwtPayload) {
    return this.scheduleService.create(data, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.scheduleService.findAll({
      shopId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    }, user);
  }

  @Public()
  @Get('public')
  findPublicByShopId(@Query('shopId') shopId: string) {
    return this.scheduleService.findPublicByShopId(shopId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.scheduleService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  update(@Param('id') id: string, @Body() data: UpdateScheduleDto, @CurrentUser() user: JwtPayload) {
    return this.scheduleService.update(id, data, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.scheduleService.remove(id, user);
  }
}
