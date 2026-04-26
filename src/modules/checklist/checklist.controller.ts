import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Body,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';
import { FindAppointmentByIdRepository } from '../appointment/repository';

@Controller('checklist')
export class ChecklistController {
  constructor(
    private readonly checklistService: ChecklistService,
    private readonly storageService: StorageService,
    private readonly findAppointmentByIdRepository: FindAppointmentByIdRepository,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 12 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(@UploadedFiles() files: Array<Express.Multer.File>, @Body() createChecklistDto: CreateChecklistDto) {
    if (files?.length) {
      const appointment = await this.findAppointmentByIdRepository.findById(createChecklistDto.appointmentId);
      if (!appointment?.shop?.organizationId) {
        throw new NotFoundException('Agendamento/loja nao encontrados para upload de checklist');
      }

      const photoUrls = await Promise.all(
        files.map((file) =>
          this.storageService.uploadFile({
            file,
            fileType: 'IMAGE',
            context: {
              type: 'SHOP',
              organizationId: appointment.shop.organizationId,
              shopId: appointment.shopId,
              category: 'checklist',
              appointmentId: createChecklistDto.appointmentId,
            },
          }),
        ),
      );

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
  async remove(@Param('id') id: string) {
    const checklist = await this.checklistService.findOne(id);

    if (checklist?.photos?.length) {
      await Promise.allSettled(checklist.photos.map((url) => this.storageService.deleteFile(url)));
    }

    return this.checklistService.remove(id);
  }
}
