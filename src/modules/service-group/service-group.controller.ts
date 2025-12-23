import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServiceGroupService } from './service-group.service';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';

@Controller('service-groups')
export class ServiceGroupController {
    constructor(private readonly serviceGroupService: ServiceGroupService) {}

    @Post()
    create(@Body() createServiceGroupDto: CreateServiceGroupDto) {
        return this.serviceGroupService.create(createServiceGroupDto);
    }

    @Get()
    findAll(@Query('shopId') shopId?: string) {
        return this.serviceGroupService.findAll(shopId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.serviceGroupService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServiceGroupDto: UpdateServiceGroupDto) {
        return this.serviceGroupService.update(id, updateServiceGroupDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.serviceGroupService.remove(id);
    }
}
