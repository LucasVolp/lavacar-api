import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ShopManagerService } from './shop-manager.service';
import { CreateShopManagerDto, UpdateShopManagerDto } from './dto';

@Controller('shop-managers')
export class ShopManagerController {
    constructor(private readonly shopManagerService: ShopManagerService) {}

    @Post()
    create(@Body() data: CreateShopManagerDto) {
        return this.shopManagerService.create(data);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.shopManagerService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get('shop/:shopId')
    findByShopId(
        @Param('shopId') shopId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.shopManagerService.findByShopId(shopId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get('member/:memberId')
    findByMemberId(
        @Param('memberId') memberId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.shopManagerService.findByMemberId(memberId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.shopManagerService.findById(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateShopManagerDto) {
        return this.shopManagerService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.shopManagerService.delete(id);
    }
}
