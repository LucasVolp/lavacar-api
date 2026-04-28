import { Controller, Get, Post, Body, Param, Delete, Query, Patch, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from 'src/guards/subscription.guard';
import { ShopClientService } from './shop-client.service';
import { CreateShopClientDto } from './dto/create-shop-client.dto';
import { UpdateShopClientDto } from './dto/update-shop-client.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('shop-clients')
@UseGuards(SubscriptionGuard)
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class ShopClientController {
    constructor(private readonly shopClientService: ShopClientService) {}

    @Post()
    create(@Body() createShopClientDto: CreateShopClientDto, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.create(createShopClientDto, user);
    }

    @Get()
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('search') search?: string,
    ) {
        return this.shopClientService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
            search,
        }, user);
    }

    @Get('shop/:shopId')
    findByShopId(
        @CurrentUser() user: JwtPayload,
        @Param('shopId') shopId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('search') search?: string,
    ) {
        return this.shopClientService.findByShopId(shopId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
            search,
        }, user);
    }

    @Get('shop-and-user')
    @Public()
    findByShopAndUser(
        @Query('shopId') shopId: string,
        @Query('userId') userId: string,
    ) {
        return this.shopClientService.findByShopAndUser(shopId, userId);
    }

    @Get('shop/:shopId/count')
    countByShopId(@Param('shopId') shopId: string, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.countByShopId(shopId, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.findOne(id, user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateShopClientDto: UpdateShopClientDto, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.update(id, updateShopClientDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.shopClientService.remove(id, user);
    }
}
