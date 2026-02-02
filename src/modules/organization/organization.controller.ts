import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Controller('organizations')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Post()
    create(@Body() data: CreateOrganizationDto) {
        return this.organizationService.create(data);
    }

    @Get()
    findAll() {
        return this.organizationService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.organizationService.findById(id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.organizationService.findBySlug(slug);
    }

    @Get('owner/:ownerId')
    findByOwner(@Param('ownerId') ownerId: string) {
        return this.organizationService.findByOwner(ownerId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateOrganizationDto) {
        return this.organizationService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.organizationService.delete(id);
    }
}
