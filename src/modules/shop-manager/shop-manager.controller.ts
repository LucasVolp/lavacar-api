import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from 'src/guards/subscription.guard';
import { ShopManagerService } from './shop-manager.service';
import { CreateShopManagerDto, UpdateShopManagerDto } from './dto';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('shop-managers')
@UseGuards(SubscriptionGuard)
export class ShopManagerController {
    constructor(private readonly shopManagerService: ShopManagerService) {}

    @Post()
    @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
    create(@Body() data: CreateShopManagerDto) {
        return this.shopManagerService.create(data);
    }

    @Get()
    @Roles(Role.ADMIN, Role.OWNER)
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
    @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
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
    @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
    findById(@Param('id') id: string) {
        return this.shopManagerService.findById(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.OWNER)
    update(@Param('id') id: string, @Body() data: UpdateShopManagerDto) {
        return this.shopManagerService.update(id, data);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.OWNER)
    delete(@Param('id') id: string) {
        return this.shopManagerService.delete(id);
    }
}
