import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('shop')
// @UseGuards(RolesGuard)
// @Roles(Role.USER)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  create(@Body() data: CreateShopDto) {
    return this.shopService.create(data);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.shopService.findAll({
      organizationId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.shopService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateShopDto) {
    return this.shopService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopService.remove(id);
  }
}
