import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('blockedtime')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class BlockedTimesController {
  constructor(private readonly blockedTimesService: BlockedTimesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  create(@Body() data: CreateBlockedTimeDto, @CurrentUser() user: JwtPayload) {
    return this.blockedTimesService.create(data, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.blockedTimesService.findAll({
      shopId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    }, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.blockedTimesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  update(@Param('id') id: string, @Body() data: UpdateBlockedTimeDto, @CurrentUser() user: JwtPayload) {
    return this.blockedTimesService.update(id, data, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.blockedTimesService.remove(id, user);
  }
}
