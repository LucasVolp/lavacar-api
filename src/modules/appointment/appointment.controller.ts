import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './types/AppointmentStatus';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Post()
    create(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
        return this.appointmentService.create(createAppointmentDto, user);
    }

    @Get()
    findAll(
        @Query('shopId') shopId?: string,
        @Query('userId') userId?: string,
        @Query('status') status?: string | string[],
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
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
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.appointmentService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
        return this.appointmentService.update(id, updateAppointmentDto);
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
