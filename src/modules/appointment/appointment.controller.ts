import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './types/AppointmentStatus';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('appointments')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER, Role.USER)
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Post()
    create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
        return this.appointmentService.create(createAppointmentDto, user);
    }

    @Get()
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('shopId') shopId?: string,
        @Query('userId') userId?: string,
        @Query('status') status?: string | string[],
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('sortOrder') sortOrder?: string,
    ) {
        let parsedStatus: AppointmentStatus | AppointmentStatus[] | undefined;

        if (status) {
            if (Array.isArray(status)) {
                parsedStatus = status as AppointmentStatus[];
            } else if (typeof status === 'string' && status.includes(',')) {
                parsedStatus = status.split(',') as AppointmentStatus[];
            } else {
                parsedStatus = status as AppointmentStatus;
            }
        }

        return this.appointmentService.findAll({
            shopId,
            userId,
            status: parsedStatus,
            startDate,
            endDate,
            page: page ? parseInt(page, 10) : undefined,
            perPage: perPage ? parseInt(perPage, 10) : undefined,
            sortOrder: sortOrder === 'desc' ? 'desc' : sortOrder === 'asc' ? 'asc' : undefined,
        }, user);
    }

    @Public()
    @Get('public/by-date')
    findPublicByShopAndDate(
        @Query('shopId') shopId: string,
        @Query('date') date: string,
    ) {
        return this.appointmentService.findPublicByShopAndDate(shopId, date);
    }

    @Public()
    @Get('public/availability')
    findPublicAvailability(
        @Query('shopId') shopId: string,
        @Query('date') date: string,
        @Query('serviceIds') serviceIds: string,
    ) {
        const parsedServiceIds = serviceIds
            ? serviceIds.split(',').map((id) => id.trim()).filter(Boolean)
            : [];

        return this.appointmentService.findPublicAvailability(shopId, date, parsedServiceIds);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.appointmentService.findOne(id, user);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateAppointmentDto: UpdateAppointmentDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.appointmentService.update(id, updateAppointmentDto, user);
    }

    @Delete(':id')
    cancel(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
        @Body('reason') reason?: string,
    ) {
        return this.appointmentService.cancel(id, user, reason);
    }
}
