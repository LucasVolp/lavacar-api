import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Public } from 'src/shared/decorators/public.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';

@Controller('service')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() createServiceDto: CreateServiceDto, @CurrentUser() user: JwtPayload) {
    return this.serviceService.create(createServiceDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId?: string,
    @Query('groupId') groupId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.serviceService.findAll(
      {
        shopId,
        groupId,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? parseInt(page, 10) : undefined,
        perPage: perPage ? parseInt(perPage, 10) : undefined,
      },
      user,
    );
  }

  @Public()
  @Get('public')
  findPublicServices(
    @Query('shopId') shopId: string,
    @Query('groupId') groupId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.serviceService.findPublicServices({
      shopId,
      groupId,
      search,
      isActive: true,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.serviceService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto, @CurrentUser() user: JwtPayload) {
    return this.serviceService.update(id, updateServiceDto, user);
  }

  @Post(':id/upload/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');

    const service = await this.serviceService.findOne(id, user);
    const url = await this.storageService.uploadFile({
      file,
      fileType: 'IMAGE',
      context: {
        type: 'SERVICE',
        organizationId: service.shop.organizationId,
        shopId: service.shopId,
        serviceId: service.id,
        category: 'cover',
      },
    });

    if (service.photoUrl) {
      await this.storageService.deleteFile(service.photoUrl).catch(() => undefined);
    }

    await this.serviceService.update(id, { photoUrl: url }, user);
    return { url };
  }

  @Delete(':id/upload/photo')
  async deletePhoto(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const service = await this.serviceService.findOne(id, user);
    if (service.photoUrl) {
      await this.storageService.deleteFile(service.photoUrl);
    }

    await this.serviceService.update(id, { photoUrl: null as unknown as string }, user);
    return { success: true };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.serviceService.remove(id, user);
  }
}
