import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { ShopClientService } from './shop-client.service';
import { CreateShopClientDto } from './dto/create-shop-client.dto';
import { UpdateShopClientDto } from './dto/update-shop-client.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('shop-clients')
export class ShopClientController {
    constructor(private readonly shopClientService: ShopClientService) {}

    @Post()
    create(@Body() createShopClientDto: CreateShopClientDto, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.create(createShopClientDto, user);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('search') search?: string,
    ) {
        return this.shopClientService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
            search,
        });
    }

    @Get('shop/:shopId')
    findByShopId(
        @Param('shopId') shopId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('search') search?: string,
    ) {
        return this.shopClientService.findByShopId(shopId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
            search,
        });
    }

    @Get('shop/:shopId/count')
    countByShopId(@Param('shopId') shopId: string) {
        return this.shopClientService.countByShopId(shopId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shopClientService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateShopClientDto: UpdateShopClientDto) {
        return this.shopClientService.update(id, updateShopClientDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shopClientService.remove(id);
    }
}