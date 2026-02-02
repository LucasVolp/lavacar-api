import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
    findAll() {
        return this.salesGoalService.findAll();
    }

    @Get('shop/:shopId')
    findByShopId(@Param('shopId') shopId: string) {
        return this.salesGoalService.findByShopId(shopId);
    }

    @Get('organization/:organizationId')
    findByOrganizationId(@Param('organizationId') organizationId: string) {
        return this.salesGoalService.findByOrganizationId(organizationId);
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