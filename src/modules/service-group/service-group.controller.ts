import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServiceGroupService } from './service-group.service';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';

@Controller('service-groups')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class ServiceGroupController {
    constructor(private readonly serviceGroupService: ServiceGroupService) {}

    @Post()
    create(@Body() createServiceGroupDto: CreateServiceGroupDto, @CurrentUser() user: JwtPayload) {
        return this.serviceGroupService.create(createServiceGroupDto, user);
    }

    @Get()
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('shopId') shopId?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.serviceGroupService.findAll({
            shopId,
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
        }, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.serviceGroupService.findOne(id, user);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServiceGroupDto: UpdateServiceGroupDto, @CurrentUser() user: JwtPayload) {
        return this.serviceGroupService.update(id, updateServiceGroupDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.serviceGroupService.remove(id, user);
    }
}
