import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from 'src/guards/subscription.guard';
import { SalesGoalService } from './sales-goal.service';
import { CreateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateSalesGoalDto } from './dto/update-sales-goal.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('sales-goal')
@UseGuards(SubscriptionGuard)
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class SalesGoalController {
    constructor(private readonly salesGoalService: SalesGoalService) {}

    @Post()
    create(@Body() createSalesGoalDto: CreateSalesGoalDto, @CurrentUser() user: JwtPayload) {
        return this.salesGoalService.create(createSalesGoalDto, user);
    }

    @Get()
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.salesGoalService.findAll({
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        }, user);
    }

    @Get('shop/:shopId')
    findByShopId(
        @CurrentUser() user: JwtPayload,
        @Param('shopId') shopId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.salesGoalService.findByShopId(shopId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        }, user);
    }

    @Get('organization/:organizationId')
    findByOrganizationId(
        @CurrentUser() user: JwtPayload,
        @Param('organizationId') organizationId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.salesGoalService.findByOrganizationId(organizationId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        }, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.salesGoalService.findOne(id, user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSalesGoalDto: UpdateSalesGoalDto, @CurrentUser() user: JwtPayload) {
        return this.salesGoalService.update(id, updateSalesGoalDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.salesGoalService.remove(id, user);
    }
}
