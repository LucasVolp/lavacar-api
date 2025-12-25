import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationMemberService } from './organization-member.service';
import { CreateOrganizationMemberDto, UpdateOrganizationMemberDto } from './dto';

@Controller('organization-members')
export class OrganizationMemberController {
    constructor(private readonly organizationMemberService: OrganizationMemberService) {}

    @Post()
    create(@Body() data: CreateOrganizationMemberDto) {
        return this.organizationMemberService.create(data);
    }

    @Get()
    findAll() {
        return this.organizationMemberService.findAll();
    }

    @Get('organization/:organizationId')
    findByOrganizationId(@Param('organizationId') organizationId: string) {
        return this.organizationMemberService.findByOrganizationId(organizationId);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.organizationMemberService.findById(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateOrganizationMemberDto) {
        return this.organizationMemberService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.organizationMemberService.delete(id);
    }
}
