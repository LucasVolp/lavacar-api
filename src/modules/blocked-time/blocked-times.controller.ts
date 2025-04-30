import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlockedTimesService } from './blocked-times.service';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto';
import { UpdateBlockedTimeDto } from './dto/update-blocked-time.dto';

@Controller('blockedtime')
export class BlockedTimesController {
  constructor(private readonly blockedTimesService: BlockedTimesService) {}

  @Post()
  create(@Body() data: CreateBlockedTimeDto) {
    return this.blockedTimesService.create(data);
  }

  @Get()
  findAll() {
    return this.blockedTimesService.findAll();
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
