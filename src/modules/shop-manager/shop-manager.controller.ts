import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
    findAll() {
        return this.shopManagerService.findAll();
    }

    @Get('shop/:shopId')
    findByShopId(@Param('shopId') shopId: string) {
        return this.shopManagerService.findByShopId(shopId);
    }

    @Get('member/:memberId')
    findByMemberId(@Param('memberId') memberId: string) {
        return this.shopManagerService.findByMemberId(memberId);
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
