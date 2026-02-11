import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('blockedtime')
export class BlockedTimesController {
  constructor(private readonly blockedTimesService: BlockedTimesService) {}

  @Post()
  create(@Body() data: CreateBlockedTimeDto, @CurrentUser() user: JwtPayload) {
    return this.blockedTimesService.create(data, user);
  }

  @Get()
  findAll(
    @Query('shopId') shopId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.blockedTimesService.findAll({
      shopId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blockedTimesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateBlockedTimeDto) {
    return this.blockedTimesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blockedTimesService.remove(id);
  }
}
