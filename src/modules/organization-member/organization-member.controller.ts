import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrganizationMemberService } from './organization-member.service';
import { CreateOrganizationMemberDto, UpdateOrganizationMemberDto } from './dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('organization-members')
export class OrganizationMemberController {
    constructor(private readonly organizationMemberService: OrganizationMemberService) {}

    @Post()
    create(@Body() data: CreateOrganizationMemberDto) {
        return this.organizationMemberService.create(data);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.organizationMemberService.findAll({
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
        return this.organizationMemberService.findByOrganizationId(organizationId, {
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        });
    }

    @Get('shop/:shopId')
    findByShopId(@Param('shopId') shopId: string) {
        return this.organizationMemberService.findByShopId(shopId);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.organizationMemberService.findById(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() data: UpdateOrganizationMemberDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.organizationMemberService.update(id, data, user);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.organizationMemberService.delete(id, user);
    }
}
