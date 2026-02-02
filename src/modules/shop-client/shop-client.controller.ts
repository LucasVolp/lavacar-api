import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ShopClientService } from './shop-client.service';
import { CreateShopClientDto } from './dto/create-shop-client.dto';

@Controller('shop-clients')
export class ShopClientController {
    constructor(private readonly shopClientService: ShopClientService) {}

    @Post()
    create(@Body() createShopClientDto: CreateShopClientDto) {
        return this.shopClientService.create(createShopClientDto);
    }

    @Get()
    findAll() {
        return this.shopClientService.findAll();
    }

    @Get('shop/:shopId')
    findByShopId(@Param('shopId') shopId: string) {
        return this.shopClientService.findByShopId(shopId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shopClientService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shopClientService.remove(id);
    }
}