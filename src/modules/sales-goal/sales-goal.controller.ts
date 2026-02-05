import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SalesGoalService } from './sales-goal.service';
import { CreateSalesGoalDto } from './dto/create-sales-goal.dto';
import { UpdateSalesGoalDto } from './dto/update-sales-goal.dto';

@Controller('sales-goal')
export class SalesGoalController {
    constructor(private readonly salesGoalService: SalesGoalService) {}

    @Post()
    create(@Body() createSalesGoalDto: CreateSalesGoalDto) {
        return this.salesGoalService.create(createSalesGoalDto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.salesGoalService.findAll({
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
        return this.salesGoalService.findByShopId(shopId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get('organization/:organizationId')
    findByOrganizationId(
        @Param('organizationId') organizationId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.salesGoalService.findByOrganizationId(organizationId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.salesGoalService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSalesGoalDto: UpdateSalesGoalDto) {
        return this.salesGoalService.update(id, updateSalesGoalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.salesGoalService.remove(id);
    }
}