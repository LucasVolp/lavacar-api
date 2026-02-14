import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Req, Query } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';

@Controller('checklist')
export class ChecklistController {
    constructor(private readonly checklistService: ChecklistService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 10, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/checklists';
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
            }
        })
    }))
    create(
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() createChecklistDto: CreateChecklistDto,
        @Req() req: Request
    ) {
        console.log('ChecklistController.create - Body:', req.body);
        console.log('ChecklistController.create - Files:', files?.length);
        
        if (files && files.length > 0) {
            const photoUrls = files.map(file => `/uploads/checklists/${file.filename}`);
            createChecklistDto.photos = photoUrls;
        }
        return this.checklistService.create(createChecklistDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.checklistService.findOne(id);
    }

    @Get('appointment/:appointmentId')
    findByAppointment(@Param('appointmentId') appointmentId: string) {
        return this.checklistService.findByAppointment(appointmentId);
    }

    @Get('user/:userId')
    findByUser(
        @Param('userId') userId: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        return this.checklistService.findByUser(
            userId,
            page ? Number(page) : undefined,
            perPage ? Number(perPage) : undefined,
        );
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateChecklistDto: UpdateChecklistDto) {
        return this.checklistService.update(id, updateChecklistDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.checklistService.remove(id);
    }
}