import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './types/AppointmentStatus';

@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Post()
    create(@Body() createAppointmentDto: CreateAppointmentDto) {
        return this.appointmentService.create(createAppointmentDto);
    }

    @Get()
    findAll(
        @Query('shopId') shopId?: string,
        @Query('userId') userId?: string,
        @Query('status') status?: AppointmentStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.appointmentService.findAll({
            shopId,
            userId,
            status,
            startDate,
            endDate,
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
        @Body('reason') reason?: string,
        @Body('userId') userId?: string,
    ) {
        return this.appointmentService.cancel(id, reason, userId);
    }
}
